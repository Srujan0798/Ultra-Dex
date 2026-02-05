export const pythonRuntime = {
  id: 'python',
  image: 'python:3.12-alpine',
  run: (file) => `python ${file}`
};

export default pythonRuntime;
