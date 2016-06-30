var mongoose = require('mongoose')


var TileSchema = new mongoose.Schema({
  zoom_level: Number,
  tile_column: Number,
  tile_row: Number,
  tile_data: Buffer
})


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, index: true },
  owner: String,

  // tilejson spec
  tilejson: { type: String, default: '2.1.0' },
  name: String,
  description: String,
  version: { type: String, default: '1.0.0' },
  attribution: String,
  template: String,
  legend: String,
  scheme: { type: String, default: 'xyz' },
  tiles: [String],
  grids: [String],
  data: [String],
  minzoom: { type: Number, default: 0 },
  maxzoom: { type: Number, default: 22 },
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],

  formatter: String,
  resolution: Number,
  format: String,
  vector_layers: [{
    _id: false,
    id: String,
    description: String,
    minzoom: Number,
    maxzoom: Number,
    source: String,
    source_name: String,
    fields: [mongoose.Schema.Types.Mixed]
  }]
}, { timestamps: true })


TileSchema.index({zoom_level: 1, tile_column: 1, tile_row: 1})


module.exports.TileSchema = TileSchema
module.exports.TilesetSchema = TilesetSchema
