var test = require('tape')
var exec = require('child_process').exec
var tilelive = require('tilelive')
var mbtiles = require('mbtiles')
var FoxgisSource = require('../index')
var mongoose = require('mongoose')


mbtiles.registerProtocols(tilelive)
FoxgisSource.registerProtocols(tilelive)

test('load url', function(t) {
  tilelive.load('foxgis+mongodb://localhost/testdb?tileset_id=beijing', function(err, src) {
    t.notOk(err)
    src.close(t.end)
  })
})

test('load url without tileset_id', function(t) {
  tilelive.load('foxgis+mongodb://localhost/testdb', function(err) {
    t.equal(err.message, 'Must specify "tileset_id" with querystring')
    t.end()
  })
})

test('putInfo from mbtiles', function(t) {
  tilelive.load('mbtiles://./test/beijing.mbtiles', function(err, src) {
    src.getInfo(function(err, info) {
      tilelive.load('foxgis+mongodb://localhost/testdb?tileset_id=beijing&owner=jingsam', function(err, dst) {
        dst.putInfo(info, function(err) {
          t.notOk(err)
          dst.close(t.end)
        })
      })
    })
  })
})

test('getInfo', function(t) {
  tilelive.load('foxgis+mongodb://localhost/testdb?tileset_id=beijing', function(err, src) {
    src.getInfo(function(err, info) {
      t.notOk(err)
      t.equal(info.tileset_id, 'beijing')
      t.equal(info.scheme, 'xyz')
      t.equal(info.owner, 'jingsam')
      t.deepEqual(info.center, [116.3400305, 39.9589555, 10])
      t.equal(info.vector_layers[0].id, 'landuse')
      src.close(t.end)
    })
  })
})

test('putTile', function(t) {
  tilelive.load('mbtiles://./test/beijing.mbtiles', function(err, src) {
    src.getTile(6, 52, 24, function(err, tile) {
      tilelive.load('foxgis+mongodb://localhost/testdb?tileset_id=beijing', function(err, dst) {
        dst.putTile(6, 52, 24, tile, function(err, tile) {
          t.error(err)
          dst.close(t.end)
        })
      })
    })
  })
})

test('clear testdb', function(t) {
  var conn = mongoose.createConnection('mongodb://localhost/testdb')
  conn.on('open', function() {

    conn.db.dropCollection('tiles_beijing', function() {
      conn.db.dropCollection('grids_beijing', function() {
        conn.db.dropCollection('tilesets', function() {
          conn.close(t.end)
        })
      })
    })
  })
})
