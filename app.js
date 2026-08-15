const defaults = [
  { name: "去离子水", total: 72.8, dispersive: 21.8, polar: 51.0, advancing: 82, receding: 68 },
  { name: "乙二醇", total: 48.0, dispersive: 29.0, polar: 19.0, advancing: 48, receding: 39 },
];
const rows = document.querySelector("#liquidRows");
const template = document.querySelector("#rowTemplate");
const errorMessage = document.querySelector("#errorMessage");

function addRow(data = { name: "", total: "", dispersive: "", polar: "", advancing: "", receding: "" }) {
  const row = template.content.firstElementChild.cloneNode(true);
  for (const key of Object.keys(data)) row.querySelector(`.${key}`).value = data[key];
  row.querySelector(".remove").addEventListener("click", () => { row.remove(); calculate(); });
  row.querySelectorAll("input").forEach(input => input.addEventListener("input", () => { errorMessage.textContent = ""; }));
  rows.append(row);
}

function readRows() {
  return [...rows.children].map(row => ({
    name: row.querySelector(".name").value.trim() || "未命名液体",
    total: Number(row.querySelector(".total").value), dispersive: Number(row.querySelector(".dispersive").value),
    polar: Number(row.querySelector(".polar").value), advancing: Number(row.querySelector(".advancing").value), receding: Number(row.querySelector(".receding").value),
  }));
}

function fit(liquids, angleKey) {
  // Y = a + bX，其中 a = √γSᵈ，b = √γSᵖ
  const points = liquids.map(liquid => {
    const radians = liquid[angleKey] * Math.PI / 180;
    return { x: liquid.dispersive ? Math.sqrt(liquid.polar / liquid.dispersive) : 0, y: liquid.total * (1 + Math.cos(radians)) / (2 * Math.sqrt(liquid.dispersive)) };
  });
  const n = points.length, sx = points.reduce((s, p) => s + p.x, 0), sy = points.reduce((s, p) => s + p.y, 0);
  const sxx = points.reduce((s, p) => s + p.x * p.x, 0), sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const denominator = n * sxx - sx * sx;
  if (Math.abs(denominator) < 1e-8) throw new Error("测试液的极性比例过于接近，无法完成两组分拟合。");
  const a = (sy * sxx - sx * sxy) / denominator, b = (n * sxy - sx * sy) / denominator;
  return { dispersive: Math.max(0, a) ** 2, polar: Math.max(0, b) ** 2 };
}

function format(value) { return Number.isFinite(value) ? value.toFixed(1) : "—"; }
function calculate() {
  const liquids = readRows();
  if (liquids.length < 2 || liquids.some(l => ![l.total, l.dispersive, l.advancing, l.receding].every(Number.isFinite) || l.total <= 0 || l.dispersive <= 0 || l.polar < 0 || l.advancing < 0 || l.advancing > 180 || l.receding < 0 || l.receding > 180)) {
    errorMessage.textContent = "请至少填写两行有效数据：表面张力需大于 0，角度范围为 0–180°。"; return;
  }
  try {
    const advancing = fit(liquids, "advancing"), receding = fit(liquids, "receding");
    const average = { dispersive: (advancing.dispersive + receding.dispersive) / 2, polar: (advancing.polar + receding.polar) / 2 };
    const total = average.dispersive + average.polar;
    const advanceTotal = advancing.dispersive + advancing.polar, recedeTotal = receding.dispersive + receding.polar;
    const hysteresis = liquids.reduce((sum, l) => sum + Math.abs(l.advancing - l.receding), 0) / liquids.length;
    document.querySelector("#totalEnergy").textContent = format(total);
    document.querySelector("#dispersiveEnergy").textContent = format(average.dispersive);
    document.querySelector("#polarEnergy").textContent = format(average.polar);
    document.querySelector("#advancingEnergy").textContent = format(advanceTotal);
    document.querySelector("#recedingEnergy").textContent = format(recedeTotal);
    document.querySelector("#hysteresis").textContent = format(hysteresis);
    document.querySelector("#fitStatus").textContent = `${liquids.length} 种液体 · 已拟合`;
    document.querySelector("#resultNote").textContent = `动态估算范围：${format(Math.min(advanceTotal, recedeTotal))}–${format(Math.max(advanceTotal, recedeTotal))} mN/m。结果为前进角与后退角拟合值的平均。`;
    errorMessage.textContent = "";
  } catch (error) { errorMessage.textContent = error.message; }
}

document.querySelector("#addLiquid").addEventListener("click", () => addRow());
document.querySelector("#calculate").addEventListener("click", calculate);
document.querySelector("#reset").addEventListener("click", () => { rows.replaceChildren(); defaults.forEach(addRow); calculate(); });
defaults.forEach(addRow); calculate();
