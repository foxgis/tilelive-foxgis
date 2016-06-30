var url = require('url')
var querystring = require('querystring')
var mongoose = require('mongoose')
var tiletype = require('tiletype')
var TileSchema = require('./schema').TileSchema
var TilesetSchema = require('./schema').TilesetSchema


var protocol = 'foxgis+mongodb:'


function FoxgisSource(uri, callback) {
  if (typeof uri === 'string') {
    uri = url.parse(uri, true)
    uri.pathname = querystring.unescape(uri.pathname)
  }

  if (typeof uri.query === 'string') {
    uri.query = querystring.parse(uri.query)
  }

  if (uri.protocol !== protocol) {
    return callback(new Error('Bad uri protocol "' + uri.protocol + '". Must be ' + protocol + '.'))
  }

  if (!uri.query.tileset_id) {
    return callback(new Error('Must specify "tileset_id" with querystring'))
  }

  var _this = this

  _this.tileset_id = uri.query.tileset_id
  _this.owner = uri.query.owner

  uri.protocol = 'mongodb:'
  _this._db = mongoose.createConnection()
  _this._db.open(url.format(uri), function(err) {
    if (err) {
      return callback(err)
    }

    var tiles = 'tiles_' + _this.tileset_id
    var grids = 'grids_' + _this.tileset_id
    _this.Tile = _this._db.model(tiles, TileSchema, tiles)
    _this.Grid = _this._db.model(grids, TileSchema, grids)
    _this.Tileset = _this._db.model('Tileset', TilesetSchema)
    _this.open = true

    callback(null, _this)
  })
}


FoxgisSource.registerProtocols = function(tilelive) {
  tilelive.protocols['foxgis+mongodb:'] = FoxgisSource
}


FoxgisSource.list = function(filepath, callback) {
  return callback(new Error(".list not implemented for " + protocol))
}


FoxgisSource.findID = function(filepath, id, callback) {
  return callback(new Error(".findID not implemented for " + protocol))
}


FoxgisSource.prototype.getTile = function(z, x, y, callback) {
  if (typeof callback !== 'function') throw new Error('Callback needed')
  if (!this.open) return callback(new Error('FoxgisSource not yet loaded'))

  this.Tile.findOne({
    zoom_level: +z,
    tile_column: +x,
    tile_row: +y
  }, function(err, tile) {
    if (err) {
      return callback(err)
    }

    if (!tile) {
      return callback(new Error('Tile does not exist'))
    }

    if (!tile.tile_data || !Buffer.isBuffer(tile.tile_data)) {
      return callback(new Error('Tile is invalid'))
    }

    var headers = tiletype.headers(tile.tile_data)
    return callback(null, tile.tile_data, headers)
  })
}


FoxgisSource.prototype.getGrid = function(z, x, y, callback) {
  if (typeof callback !== 'function') throw new Error('Callback needed')
  if (!this.open) return callback(new Error('FoxgisSource not yet loaded'))

  this.Grid.findOne({
    zoom_level: +z,
    tile_column: +x,
    tile_row: +y
  }, function(err, grid) {
    if (err) {
      return callback(err)
    }

    if (!grid) {
      return callback(new Error('Grid does not exist'))
    }

    try {
      var grid_json = JSON.parse(grid.tile_data)
    } catch (err) {
      return callback(new Error('Grid is invalid:' + err.message))
    }

    var headers = { 'Content-Type': 'text/javascript' }
    return callback(null, grid_json)
  })
}


FoxgisSource.prototype.getInfo = function(callback) {
  if (typeof callback !== 'function') throw new Error('Callback needed')
  if (!this.open) return callback(new Error('FoxgisSource not yet loaded'))
  if (this._info) return callback(null, this._info)

  var _this = this
  this.Tileset.findOne({ tileset_id: this.tileset_id }, '-_id -__v', function(err, tileset) {
    if (err) {
      callback(err)
    }

    if (!tileset) {
      callback(new Error('Info does not exist'))
    }

    _this._info = tileset.toJSON()
    return callback(null, _this._info)
  })
}


FoxgisSource.prototype.startWriting = function(callback) {
  return callback(null)
}


FoxgisSource.prototype.stopWriting = function(callback) {
  return callback(null)
}


FoxgisSource.prototype.close = function(callback) {
  this._db.close(callback)
}


FoxgisSource.prototype.putTile = function(z, x, y, tile, callback) {
  if (typeof callback !== 'function') throw new Error('Callback needed')
  if (!this.open) return callback(new Error('FoxgisSource not yet loaded'))
  if (!Buffer.isBuffer(tile)) return callback(new Error('Image needs to be a Buffer'))

  this.Tile.findOneAndUpdate({
    zoom_level: +z,
    tile_column: +x,
    tile_row: +y
  }, { tile_data: tile }, { upsert: true }, callback)
}


FoxgisSource.prototype.putGrid = function(z, x, y, grid, callback) {
  if (typeof callback !== 'function') throw new Error('Callback needed')
  if (!this.open) return callback(new Error('FoxgisSource not yet loaded'))

  this.Grid.findOneAndUpdate({
    zoom_level: +z,
    tile_column: +x,
    tile_row: +y
  }, { tile_data: grid }, { upsert: true }, callback)
}


FoxgisSource.prototype.putInfo = function(info, callback) {
  if (typeof callback !== 'function') throw new Error('Callback needed')
  if (!this.open) return callback(new Error('FoxgisSource not yet loaded'))

  var _this = this

  info.scheme = 'xyz'
  info.tileset_id = this.tileset_id
  if (this.owner) {
    info.owner = this.owner
  }

  this.Tileset.findOneAndUpdate({
    tileset_id: this.tileset_id
  }, info, { upsert: true, new: true }, function(err, tileset) {
    if (err) {
      return callback(err)
    }

    delete _this._info
    _this.getInfo(callback)
  })
}


module.exports = FoxgisSource
