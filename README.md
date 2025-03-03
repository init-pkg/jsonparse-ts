# JSON Stream Parser (TypeScript Edition)

<p align="center">
  <img src="assets/favicon.svg" width="100" height="100" alt="Logo">
</p>

This is a fully rewritten **TypeScript** version of the `jsonparse` library.
Originally created by Tim Caswell in 2012, this version modernizes the approach by following **OOP principles** and introducing additional functionality.

Unlike the original, this version fully supports **browser environments** and provides enhanced features for better control over JSON parsing.

## Features

- **Streaming JSON parsing**: Handles JSON data in chunks.
- **Full browser support**: Works both in Node.js and browser environments.
- **Improved API**: Additional methods for better parsing control.
- **Event-driven architecture**: Supports event emitters for handling tokens and values.
- **Better error handling**: Capture parsing errors more efficiently.

## Installation

```sh
npm install @init-kz/jsonparse-ts
```

## Usage

```ts
import { Parser } from '@init-kz/jsonparse-ts';

const parser = new Parser();
parser.write('[{"name": "A');
console.log(parser.getLastIncompleteValue()); // { name: "A" }

parser.write('"}, {"na');
console.log(parser.getLastIncompleteValue()); // { name: "A" }, { }

parser.write('me": "Occaecat aliq');
console.log(parser.getLastIncompleteValue()); // { name: "A" }, { name: "Occaecat aliq" }

parser.write('uip id officia ipsum deserunt ea id labore magna qui elit dolore consectetur dolore.');
console.log(parser.getLastValue()); // Full JSON structure
```

## API

### `getEmitter(): EventEmitter`
Returns the event emitter used internally by the parser.

### `onToken(callback: (token: number, value: any) => void): void`
Registers a callback for when a token is parsed.

### `onValue(callback: (value: any) => void): void`
Registers a callback for when a complete value is parsed.

### `onError(callback: (err: Error) => void): void`
Registers a callback for handling errors.

### `getLastValue(): any`
Retrieves the last fully parsed value.

### `getLastIncompleteValue(omitEmpty?: boolean): any`
Retrieves the last partially parsed value, except numbers.

### `getCurrentKey(): string | number | undefined`
Gets the current key being parsed in an object.

### `getStack(): { value: any; key?: string | number; mode?: number; }[]`
Returns the internal parsing stack.

### `getOffset(): number`
Returns the current byte offset in the stream.

### `reset(): void`
Resets the parser's internal state.

### `write(chunk: string | Uint8Array): void`
Processes a chunk of JSON data.

### Contributing

Contributions are welcome! Feel free to submit issues or open pull requests to improve the project.

## License

```
The MIT License

Copyright (c) 2012 Tim Caswell
Copyright (c) 2025 INIT.KZ
```
