import { WebApp } from '@husca/husca';

const app = new WebApp({
  routers: ['./src/routers'],
});

app.listen(3000, () => {
  console.log('Server started...');
});
