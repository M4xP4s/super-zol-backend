import chalk from 'chalk';
export default async function onContextChange(ctx) {
  if (ctx.usage > 0.6) {
    console.log(
      chalk.yellow(`[Context] ${Math.round(ctx.usage * 100)}% used – consider clearing.`)
    );
  }
}
