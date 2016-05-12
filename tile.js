var mongoose = require('mongoose')


var TileSchema = new mongoose.Schema({
  zoom_level: Number,
  tile_column: Number,
  tile_row: Number,
  tile_data: Buffer
})


TileSchema.index({zoom_level: 1, tile_column: 1, tile_row: 1})


module.exports = TileSchema
