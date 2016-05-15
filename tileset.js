var mongoose = require('mongoose')
var select = require('mongoose-json-select')


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
  formatter: String,
  scheme: { type: String, default: 'xyz' },
  tiles: [String],
  grids: [String],
  data: [String],
  minzoom: { type: Number, default: 0 },
  maxzoom: { type: Number, default: 22 },
  resolution: { type: Number, default: 4 },
  bounds: { type: [Number], default: [-180, -90, 180, 90] },
  center: [Number],

  filesize: Number,
  format: String,
  vector_layers: [{
    _id: false,
    id: String,
    description: String,
    minzoom: Number,
    maxzoom: Number,
    fields: [mongoose.Schema.Types.Mixed]
  }]
}, { timestamps: true })


TilesetSchema.plugin(select, '-_id -__v')


module.exports = TilesetSchema
