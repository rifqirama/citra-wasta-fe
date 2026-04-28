const { execSync } = require('child_process');
try {
  console.log(execSync('git checkout -b feature/redesign-and-gallery', { cwd: 'd:\\my-project\\project\\dev-projects\\citra-wastra\\citra-wastra-frontend' }).toString());
  console.log(execSync('git push -u origin feature/redesign-and-gallery', { cwd: 'd:\\my-project\\project\\dev-projects\\citra-wastra\\citra-wastra-frontend' }).toString());
} catch (e) {
  console.error(e.stderr.toString());
}