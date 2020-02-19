const path = require('path');
const fs = require('fs');
import HtmlWebpackPlugin from 'html-webpack-plugin';

export const makeFolderAlias = (folderPath: string, target?: string) => {
  const folders = fs.readdirSync(folderPath);
  return folders.reduce((acc: { [key: string]: string }, folder: string) => {
    acc[`@${folder}`] = path.resolve(
      __dirname,
      `${target || folderPath}/${folder}`
    );
    return acc;
  }, {});
};

type HTMLPages = HtmlWebpackPlugin[];

export const makeHTMLPages = (pages: string[], basePath: string) => {
  return pages.reduce<HTMLPages>((acc, page) => {
    acc.push(
      new HtmlWebpackPlugin({
        template: `${basePath}/${page}/index.html`,
        filename: `${page}.html`,
        chunks: []
      })
    );
    return acc;
  }, []);
};