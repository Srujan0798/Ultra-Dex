export const nodeRuntime = {
  id: 'node',
  image: 'node:22-alpine',
  run: (file) => `node ${file}`
};

export default nodeRuntime;
