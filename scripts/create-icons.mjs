import fs from 'fs';

// A minimal valid 192x192 PNG buffer with UNT blue background
// 1x1 transparent/blue PNG data URI or standard solid PNG
const minimalPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAMAAAB/Pny7AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAzUExURQArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZgArZhgC0vYAAAAQdFJOUwAECBAgQIECBAgQIECBAgK2yWcDAAAAUElEQVR42uzBAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOBvDEwAAAH9qfEAAAAASUVORK5CYII=";

const buffer = Buffer.from(minimalPngBase64, 'base64');
fs.writeFileSync('public/icon-192.png', buffer);
fs.writeFileSync('public/icon-512.png', buffer);
console.log('Icons generated successfully');
