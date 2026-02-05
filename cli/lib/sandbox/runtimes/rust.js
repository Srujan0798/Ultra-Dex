export const rustRuntime = {
  id: 'rust',
  image: 'rust:1.76-alpine',
  run: (file) => `rustc ${file} -o /tmp/out && /tmp/out`
};

export default rustRuntime;
