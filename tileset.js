var mongoose = require('mongoose')


var TilesetSchema = new mongoose.Schema({
  tileset_id: { type: String, index: true },
  tilejson: mongoose.Schema.Types.Mixed
})


module.exports = mongoose.model('Tileset', TilesetSchema)
