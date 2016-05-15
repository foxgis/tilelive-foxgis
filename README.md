# tilelive-foxgis
A tilelive plugin to serve tiles with mongodb

Q: What the heck does that mean?

A: With this installed, you can use MongoDB to read/write map image tiles from/to other tilelive.js sources/sinks (mbtiles, Mapnik, TileJSON, S3, etc.)

Q: Come again?

A: You can use MongoDB to serve maps.

Q: What's the difference with [mongotiles](https://github.com/vsivsi/mongotiles) ?

A: Mongotiles uses GridFS to store tiles, we use mongodb documents instead. GridFS is meant to save big files. Since the size of a tile is less that 4MB, it could be more efficient to serve tiles with mongodb documents.

Q: How to install it?

A: Just install it using npm: `npm install tilelive-foxgis --save`

Q: And how to use it?

A: Tilelive should work with other tilelive plugins. Suppose we want to import tiles from a mbtiles source. First install necessary packages:
```
npm install tilelive --save
npm install mbtiles --save
```

Then:
```
./node_modules/tilelive/bin/copy "mbtiles://./test/beijing.mbtiles" \
  "foxgis+mongodb://localhost/testdb?tileset_id=beijing"
```

Note that `tileset_id` is necessary, don't forget it.
