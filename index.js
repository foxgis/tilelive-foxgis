var url = require('url')
var querystring = require('querystring')
var mongoose = require('mongoose')
var TileSchema = require('./tile')
var Tileset = require('./tileset')
var tiletype = require('tiletype')


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
    return callback(new Error('Must specify tileset_id in uri with "?tileset_id={id}"'))
  }

  var foxgisSource = this

  this.tileset_id = uri.query.tileset_id
  var tiles = 'Tiles_' + this.tileset_id
  var grids = 'Grids_' + this.tileset_id
  this.Tile = mongoose.model(tiles, GroupSchema, tiles)
  this.Grid = mongoose.model(grids, GroupSchema, grids)

  this.starts = 0

  uri.protocol = 'mongodb:'
  this.server = url.format(uri)
  mongoose.connect(this.server, function(err) {
    if (err) {
      return callback(err)
    }

    callback(null, foxgisSource)
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
  Tileset.findOne({ tileset_id: this.tileset_id }, function(err, tileset) {
    if (err) {
      callback(err)
    }

    if (!tileset) {
      callback(new Error('Info does not exist'))
    }

    return callback(null, tileset.tilejson)
  })
}


FoxgisSource.prototype.startWriting = function(callback) {
  this.starts += 1
  return callback(null)
}


FoxgisSource.prototype.stopWriting = function(callback) {
  this.starts -= 1
  return callback(null)
}


FoxgisSource.prototype.close = function(callback) {
  mongoose.connection.close(callback)
}


FoxgisSource.prototype.putTile = function(z, x, y, tile, callback) {
  if (!this.starts) {
    return callback(new Error("Error, writing not started."))
  }

  this.Tile.findOneAndUpdate({
    zoom_level: +z,
    tile_column: +x,
    tile_row: +y
  }, { tile_data: tile }, { upsert: true }, callback })
}


FoxgisSource.prototype.putGrid = function(z, x, y, grid, callback) {
  if (!this.starts) {
    return callback(new Error("Error, writing not started."))
  }

  this.Grid.findOneAndUpdate({
    zoom_level: +z,
    tile_column: +x,
    tile_row: +y
  }, { tile_data: grid }, { upsert: true }, callback})
}


FoxgisSource.prototype.putInfo = function(info, callback) {
  if (!this.starts) {
    return callback(new Error("Error, writing not started."))
  }

  Tileset.findOneAndUpdate({
    tileset_id: this.tileset_id
  }, { tilejson: info }, { upsert: true }, function(err) {
    if (err) {
      callback(err)
    }
  })
}


module.exports = FoxgisSource
