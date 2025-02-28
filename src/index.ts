import { Parser } from "./parser";
export { Parser };

const parser = new Parser();

parser.onValue((value) => {
  console.log(value);
});
 debugger;
parser.write('{"value": ["snow: ☃!","xyz","¡qu');
