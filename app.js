const liquids = [
  { name: "去离子水", total: 72.8, dispersive: 21.8, polar: 51.0, inputId: "waterAngle" },
  { name: "乙二醇", total: 48.0, dispersive: 29.0, polar: 19.0, inputId: "glycolAngle" },
];

const form = document.querySelector("#calculatorForm");
const errorMessage = document.querySelector("#errorMessage");

function readLiquids() {
  return liquids.map(liquid => {
    const rawValue = document.querySelector(`#${liquid.inputId}`).value.trim();
    return { ...liquid, angle: rawValue === "" ? Number.NaN : Number(rawValue) };
  });
}

function fitSurfaceEnergy(measurements) {
  // OWRK 线性式：Y = a + bX，其中 a = √γSᵈ，b = √γSᵖ。
  const points = measurements.map(liquid => {
    const radians = liquid.angle * Math.PI / 180;
    return {
      x: Math.sqrt(liquid.polar / liquid.dispersive),
      y: liquid.total * (1 + Math.cos(radians)) / (2 * Math.sqrt(liquid.dispersive)),
    };
  });

  const [first, second] = points;
  const slope = (second.y - first.y) / (second.x - first.x);
  const intercept = first.y - slope * first.x;
  return { dispersive: Math.max(0, intercept) ** 2, polar: Math.max(0, slope) ** 2 };
}

function format(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "—";
}

function calculate() {
  const measurements = readLiquids();
  const invalidMeasurement = measurements.some(item => !Number.isFinite(item.angle) || item.angle < 0 || item.angle > 180);
  if (invalidMeasurement) {
    errorMessage.textContent = "请填写两种测试液的有效前进动态接触角（0–180°）。";
    return;
  }

  const surfaceEnergy = fitSurfaceEnergy(measurements);
  document.querySelector("#totalEnergy").textContent = format(surfaceEnergy.dispersive + surfaceEnergy.polar);
  document.querySelector("#dispersiveEnergy").textContent = format(surfaceEnergy.dispersive);
  document.querySelector("#polarEnergy").textContent = format(surfaceEnergy.polar);
  document.querySelector("#fitStatus").textContent = "已计算";
  errorMessage.textContent = "";
}

form.addEventListener("submit", event => {
  event.preventDefault();
  calculate();
});

document.querySelectorAll("input").forEach(input => input.addEventListener("input", () => {
  errorMessage.textContent = "";
  document.querySelector("#fitStatus").textContent = "待计算";
}));
