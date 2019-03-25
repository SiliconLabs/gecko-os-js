/*
  * Gecko OS Web App, Gecko OS JS API Library & Gecko OS JS Build System
  *
  * Copyright (C) 2019, Silicon Labs
  * All Rights Reserved.
  *
  * The Gecko OS Web App, Gecko OS JavaScript API and Gecko OS JS build system are
  * provided by Silicon Labs. The combined source code, and all derivatives, are licensed
  * by Silicon Labs SOLELY for use with devices manufactured by Silicon Labs, or hardware
  * authorized by Silicon Labs.
  *
  * THIS SOFTWARE IS PROVIDED BY THE AUTHOR 'AS IS' AND ANY EXPRESS OR IMPLIED
  * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  * MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
  * SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
  * OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
  * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
  * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
  * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY
  * OF SUCH DAMAGE.
*/

(function (root, factory) {
  if ( typeof define === 'function' && define.amd ) {
    define(['superagent'], function(request) {
      root.Gecko_OSDevice = factory(request);
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(require('superagent'));
  } else {
    root.Gecko_OSDevice = factory(superagent);
  }
}(this, function (request) {

  return function(args) {
    args = args || {};

    var device = {
      host:       args.host       || '',
      auth:       args.auth       || null,
      timeout:    args.timeout    || 120000,
      retries:    args.retries    || 1
    };

    var getCommands = [ {adc_take_sample  : 'adc'},
                        {get              : 'get'},
                        {gpio_get         : 'gge'},
                        {gpios_get        : 'gges'},
                        {help             : 'help'},
                        {ls               : 'ls'},
                        {stream_list      : 'list'},
                        {version          : 'ver'},
                        {wlan_scan        : 'scan'},
                        {wlan_get_rssi    : 'rssi'}
                      ];

    var postCommands = [{dac_set_level    : 'dac'},
                        {factory_reset    : 'fac'},
                        {faults_print     : 'faup'},
                        {faults_reset     : 'faur'},
                        {file_delete      : 'fde'},
                        {file_open        : 'fop'},
                        {format_flash     : 'format'},
                        {gpio_dir         : 'gdi'},
                        {gpio_set         : 'gse'},
                        {gpios_dir        : 'gdis'},
                        {gpios_set        : 'gses'},
                        {http_add_header  : 'had'},
                        {http_download    : 'hdo'},
                        {http_get         : 'hge'},
                        {http_head        : 'hhe'},
                        {http_post        : 'hpo'},
                        {http_read_status : 'hre'},
                        {http_upload      : 'hup'},
                        {load             : 'load'},
                        {mdns_discover    : 'mdns'},
                        {network_down     : 'ndo'},
                        {network_lookup   : 'nlo'},
                        {network_up       : 'nup'},
                        {network_restart  : 'nre'},
                        {network_verify   : 'nve'},
                        {ota              : 'ota'},
                        {ping             : 'ping'},
                        {pwm_update       : 'pwm'},
                        {reboot           : 'reboot'},
                        {save             : 'save'},
                        {set              : 'set'},
                        {setup_web        : 'setup_web'},
                        {sleep            : 'sleep'},
                        {stream_close     : 'close'},
                        {stream_poll      : 'poll'},
                        {stream_read      : 'read'},
                        {tcp_client       : 'tcpc'},
                        {tcp_server       : 'tcps'},
                        {tls_client       : 'tlsc'},
                        {tls_server       : 'tlss'},
                        {udp_client       : 'udpc'},
                        {udp_server       : 'udps'},
                        {wps              : 'wps'}
                      ];


    var uniqueCommands = [{file_create  : 'fcr'},
                          {stream_write : 'write'},
                          {smtp_send    : 'smtp'}
                         ];


    getCommands.forEach(function(cmd){
      var getFn = function(args, callback, attempt) {
        attempt = attempt || 1;

        args = args || {};

        if(typeof callback !== 'function') {
          attempt = Number(callback);
          callback = null;
        }

        if(typeof args === 'function') {
          callback = args;
          args = {};
        }

        var uri = device.host + '/command/' + Object.keys(cmd)[0] + ((typeof args.args !== 'undefined') ? ' ' + args.args : '');

        var xhr = request.get(uri)
                    .set('Content-Type', 'application/json')
                    .set('Accept', 'application/json')
                    .timeout((args.timeout ? Number(args.timeout) : device.timeout));

        if(device.auth) {
          xhr.auth(device.auth.user, device.auth.pass);
        }

        var xhrObj = {};

        xhr.onComplete = function(err, res) {};

        xhr.onSuccess = function(res) {
          if(typeof callback === 'function') {
            return callback(null, res);
          }
        };

        xhr.onFail = function(err, res) {
          if(typeof callback === 'function') {
            return callback(err, res);
          }
        };

        xhrObj.done = function(fn) {
          if(typeof fn !== 'function') {
            return new Error('Object is not a Function.');
          }

          xhr.onSuccess = fn;

          return xhrObj;
        };

        xhrObj.fail = function(fn) {
          if(typeof fn !== 'function') {
            return new Error('Object is not a Function.');
          }

          xhr.onFail = fn;

          return xhrObj;
        };

        xhrObj.always = function(fn) {
          if(typeof fn !== 'function') {
            return new Error('Object is not a Function.');
          }

          xhr.onComplete = fn;

          return xhrObj;
        };

        xhrObj.abort = function() {
          xhr.abort();
        }

        xhr.end(function(err, res) {

          if(Object.hasOwnProperty(args.acceptCommandFailed) && args.acceptCommandFailed === false){
            //allow backwards compatability of acceptCommandFailed being undefined

            if(JSON.parse(res.text) === 'Command Failed\r\n'){
              err = new Error('Command Failed');
            }
          }

          xhr.onComplete(err, res);

          if(!err) {
            return xhr.onSuccess(JSON.parse(res.text));
          }

          if(attempt >= (args.retries ? args.retries : device.retries)) {
            return xhr.onFail(err, res);
          }

          xhrObj = getFn(args, callback, (attempt+1)).done(xhr.onSuccess).fail(xhr.onFail).always(xhr.onAlways);

        });

        if(args.hasOwnProperty('done') && typeof args.done === 'function') {
          xhrObj.done(args.done);
        }

        if(args.hasOwnProperty('fail') && typeof args.fail === 'function') {
          xhrObj.fail(args.fail);
        }

        if(args.hasOwnProperty('always') && typeof args.always === 'function') {
          xhrObj.always(args.always);
        }

        return xhrObj;
      };

      device[Object.keys(cmd)[0]] = getFn;

      if(Object.keys(cmd)[0] !== cmd[Object.keys(cmd)[0]]) {
        device[cmd[Object.keys(cmd)[0]]] = getFn;
      }
    });

    postCommands.forEach(function(cmd){
      var postFn = function(args, callback, attempt) {
        attempt = attempt || 1;

        args = args || {};

        if(typeof callback !== 'function') {
          attempt = Number(callback);
          callback = null;
        }

        if(typeof args === 'function') {
          callback = args;
          args = {flags: 0};
        }

        args.flags = args.flags || 0;

        var uri = device.host + '/command';

        var xhr = request.post(uri)
                    .set('Content-Type', 'application/json')
                    .set('Accept', 'application/json')
                    .timeout((args.timeout ? Number(args.timeout) : device.timeout))
                    .send(JSON.stringify({flags: args.flags, command: cmd[Object.keys(cmd)[0]] + ((typeof args.args !== 'undefined') ? ' ' + args.args : '')}));

        if(device.auth) {
          xhr.auth(device.auth.user, device.auth.pass);
        }

        var xhrObj = {};

        xhr.onComplete = function(err, res) {};

        xhr.onSuccess = function(res) {
          if(typeof callback === 'function') {
            return callback(null, res);
          }
        };

        xhr.onFail = function(err, res) {
          if(typeof callback === 'function') {
            return callback(err, res);
          }
        };

        xhrObj.done = function(fn) {
          if(typeof fn !== 'function') {
            return new Error('Object is not a Function.');
          }

          xhr.onSuccess = fn;

          return xhrObj;
        };

        xhrObj.fail = function(fn) {
          if(typeof fn !== 'function') {
            return new Error('Object is not a Function.');
          }

          xhr.onFail = fn;

          return xhrObj;
        };

        xhrObj.always = function(fn) {
          if(typeof fn !== 'function') {
            return new Error('Object is not a Function.');
          }

          xhr.onComplete = fn;

          return xhrObj;
        };

        xhrObj.abort = function() {
          xhr.abort();
        }

        xhr.end(function(err, res) {

          if(Object.hasOwnProperty(args.acceptCommandFailed) && args.acceptCommandFailed === false){
            //allow backwards compatability of acceptCommandFailed being undefined

            if(JSON.parse(res.text) === 'Command Failed\r\n'){
              err = new Error('Command Failed');
            }
          }

          xhr.onComplete(err, res);

          if(!err) {
            return xhr.onSuccess(JSON.parse(res.text));
          }

          if(attempt >= (args.retries ? args.retries : device.retries)){
            return xhr.onFail(err, res);
          }

          xhrObj = postFn(args, callback, (attempt+1)).done(xhr.onSuccess).fail(xhr.onFail).always(xhr.onAlways);
        });

        if(args.hasOwnProperty('done') && typeof args.done === 'function') {
          xhrObj.done(args.done);
        }

        if(args.hasOwnProperty('fail') && typeof args.fail === 'function') {
          xhrObj.fail(args.fail);
        }

        if(args.hasOwnProperty('always') && typeof args.always === 'function') {
          xhrObj.always(args.always);
        }

        return xhrObj;
      };

      device[Object.keys(cmd)[0]] = postFn;

      if(Object.keys(cmd)[0] !== cmd[Object.keys(cmd)[0]]) {
        device[cmd[Object.keys(cmd)[0]]] = postFn;
      }
    });


    // helper functions
    device.crc = function(data) {
      // computes CCITT CRC-32 value and return hex string with leading 0x
      // modified from http://www.zorc.breitbandkatze.de/crc.html
      // data as ArrayBuffer

      var makeCRCTable = function(){
        var c;
        var crcTable = [];
        for(var n =0; n < 256; n++){
            c = n;
            for(var k =0; k < 8; k++){
                c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
            }
            crcTable[n] = c;
        }
        return crcTable;
      }

      var dataView = new DataView(data);

      // check for the existence and create if necessary
      var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
      var crc = 0 ^ (-1);

      for (var i = 0; i < dataView.byteLength; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ dataView.getInt8(i)) & 0xFF];
      }

      return '0x' + ((crc ^ (-1)) >>> 0).toString(16).toUpperCase();
    };

    // node & IE dont have window.btoa method
    // https://gist.github.com/jonleighton/958841
    var base64ArrayBuffer = function(arrayBuffer) {
      var base64    = '';
      var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

      var bytes         = new Uint8Array(arrayBuffer);
      var byteLength    = bytes.byteLength;
      var byteRemainder = byteLength % 3;
      var mainLength    = byteLength - byteRemainder;

      var a, b, c, d;
      var chunk;

      for(var i = 0; i < mainLength; i = i + 3) {
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        a = (chunk & 16515072) >> 18;
        b = (chunk & 258048)   >> 12;
        c = (chunk & 4032)     >>  6;
        d = chunk & 63;
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
      }
      if(byteRemainder == 1) {
        chunk = bytes[mainLength];
        a = (chunk & 252) >> 2;
        b = (chunk & 3)   << 4;
        base64 += encodings[a] + encodings[b] + '==';
      } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
        a = (chunk & 64512) >> 10;
        b = (chunk & 1008)  >>  4;
        c = (chunk & 15)    <<  2;
        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
      }
      return base64;
    }



    // unique functions
    var writeFn = function(args, callback) {

      if(typeof args !== 'object'){
        return new Error('invalid arguments');
      }

      if(!(args.data instanceof ArrayBuffer)) {
        return new Error('data should be type ArrayBuffer');
      }

      if(typeof callback !== 'function') {
        callback = null;
      }

      args = args || {flags: 4, retries: device.retries || 3, acceptCommandFailed: true};
      args.retries = args.retries || device.retries;
      args.flags = 4; // ensure base64 encoded data flag set

      // max 4k for WiConnect requests - take 2560 bytes at a time - 2.5k => ~3.5k base64 string
      var chunkSize = 2560;
      var chunks = Math.ceil(args.data.byteLength / chunkSize);
      var finalChunkSize = args.data.byteLength % chunkSize;
      var i = 1;

      var uri = device.host + '/command';

      var xhrObj = {},
          writer = {};

      writer.onComplete = function(err, res) {};

      writer.onSuccess = function(res) {
        if(typeof callback === 'function') {
          return callback(null, res);
        }
      };

      writer.onFail = function(err, res) {
        if(typeof callback === 'function') {
          return callback(err, res);
        }
      };

      writer.end = function(err, res) {
        writer.onComplete(err, res);
        if(err) {
          return writer.onFail(err, res);
        }
        writer.onSuccess(JSON.parse(res.text));
      }

      var writeChunk = function(attempt) {
        attempt = attempt || 0;

        var byteFrom = (i-1) * chunkSize;
        var byteTo = i * chunkSize;

        if(i === chunks && finalChunkSize > 0){
          byteTo = byteFrom + finalChunkSize;
        }

        var data = base64ArrayBuffer(args.data.slice(byteFrom, byteTo));

        writer.xhr = request.post(uri)
                        .set('Content-Type', 'application/json')
                        .set('Accept', 'application/json')
                        .timeout((args.timeout ? Number(args.timeout) : device.timeout))
                        .send(JSON.stringify({
                          command: 'write ' + args.args + ' ' + ((i === chunks && finalChunkSize > 0) ? finalChunkSize : chunkSize),
                          flags: args.flags,
                          data: data
                        }))
                        .end(function(err, res) {
                          if(err){
                            if(attempt >= args.retries){
                              //fail
                              return writer.end(new Error('error writing file'), res);
                            }
                            // retry chunk
                            return writeChunk(attempt+1);
                          }

                          try {
                            var response = JSON.parse(res.text).response.replace('\r\n','');
                            if(response === 'Command failed') {
                              if(attempt >= args.retries){
                                //fail
                                return writer.end(new Error('error writing file'), res);
                              }
                              // retry chunk
                              return writeChunk(attempt+1);
                            }

                            // send next chunk
                            if(i < chunks){
                              i++;
                              return writeChunk();
                            }

                            // was last chunk
                            writer.end(null, res);
                          }
                          catch(e) {
                            return writer.end(e);
                          }
                        });
      };


      xhrObj.done = function(fn) {
        if(typeof fn !== 'function') {
          return new Error('Object is not a Function.');
        }
        writer.onSuccess = fn;
        return xhrObj;
      };

      xhrObj.fail = function(fn) {
        if(typeof fn !== 'function') {
          return new Error('Object is not a Function.');
        }
        writer.onFail = fn;
        return xhrObj;
      };

      xhrObj.always = function(fn) {
        if(typeof fn !== 'function') {
          return new Error('Object is not a Function.');
        }
        writer.onComplete = fn;
        return xhrObj;
      };

      xhrObj.abort = function() {
        writer.xhr.abort();
      };

      xhrObj.progress = function() {
        return Number(writer.chunksComplete);
      };

      xhrObj.total = function() {
        return Number(writer.totalChunks);
      };

      if(args.hasOwnProperty('done') && typeof args.done === 'function') {
        xhrObj.done(args.done);
      }

      if(args.hasOwnProperty('fail') && typeof args.fail === 'function') {
        xhrObj.fail(args.fail);
      }

      if(args.hasOwnProperty('always') && typeof args.always === 'function') {
        xhrObj.always(args.always);
      }

      writeChunk();

      return xhrObj;
    };



    var fileFn = function(args, callback) {
      if(typeof args !== 'object') {
        return new Error('invalid arguments');
      }

      if(!(args.hasOwnProperty('filename')) || !(args.data instanceof ArrayBuffer)) {
        return new Error('invalid arguments');
      }

      if(typeof callback !== 'function') {
        callback = null;
      }

      args.retries = args.retries || device.retries;

      var fileStream = '';

      var uri = device.host + '/command';

      var xhrObj = {},
          fcr = {};

      fcr.onComplete = function(err, res) {};

      fcr.onSuccess = function(res) {
        if(typeof callback === 'function') {
          return callback(null, res);
        }
      };

      fcr.onFail = function(err, res) {
        if(typeof callback === 'function') {
          return callback(err, res);
        }
      };

      fcr.end = function(err, res) {
        fcr.onComplete(err, res);
        if(err) {
          return fcr.onFail(err, res);
        }
        fcr.onSuccess(JSON.parse(res.text));
      };

      // create a file in open mode and start sending chunks
      var openFile = function(attempt) {
        attempt = attempt || 1;

        fcr.xhr = request.post(uri)
                    .set('Content-Type', 'application/json')
                    .set('Accept', 'application/json')
                    .timeout((args.timeout ? Number(args.timeout) : device.timeout))
                    .send(JSON.stringify({
                      flags: 0,
                      command: 'fcr' + ((typeof args.args !== 'undefined') ? ' ' + args.args : '') + ' ' + args.filename + ' ' + args.data.byteLength + ' -o -v 1.0.0 -t 0xFE -c ' + device.crc(args.data)
                    }))
                    .end(function(err, res){
                      if(err){
                        if(attempt >= args.retries) {
                          return fcr.end(err, res);
                        }
                        return openFile(attempt+1);
                      }

                      try {
                        fileStream = JSON.parse(res.text).response.replace('\r\n','');
                        if(fileStream === 'Command failed' || isNaN(fileStream)) {
                          if(attempt >= args.retries) {
                            return fcr.end(new Error('error creating file stream'));
                          }
                          return openFile(attempt+1);
                        }
                        // write
                        args.args = fileStream
                        fcr.writer = device.write(args, callback).done(fcr.onSuccess).fail(fcr.onFail).always(fcr.onComplete);
                      }
                      catch(e) {
                        // fail
                        return fcr.end(e);
                      }
                    });
      }


      xhrObj.done = function(fn) {
        if(typeof fn !== 'function') {
          return new Error('Object is not a Function.');
        }
        fcr.onSuccess = fn;
        return xhrObj;
      };

      xhrObj.fail = function(fn) {
        if(typeof fn !== 'function') {
          return new Error('Object is not a Function.');
        }
        fcr.onFail = fn;
        return xhrObj;
      };

      xhrObj.always = function(fn) {
        if(typeof fn !== 'function') {
          return new Error('Object is not a Function.');
        }
        fcr.onComplete = fn;
        return xhrObj;
      };

      xhrObj.abort = function() {
        if(fcr.writer){
         fcr.writer.abort()
        }
        fcr.xhr.abort();
      };

      if(args.hasOwnProperty('done') && typeof args.done === 'function') {
        xhrObj.done(args.done);
      }

      if(args.hasOwnProperty('fail') && typeof args.fail === 'function') {
        xhrObj.fail(args.fail);
      }

      if(args.hasOwnProperty('always') && typeof args.always === 'function') {
        xhrObj.always(args.always);
      }

      openFile();

      return xhrObj;
    };

    device['stream_write']  = writeFn;
    device['write']         = writeFn;
    device['file_create']   = fileFn;
    device['fcr']           = fileFn;

    return device;
  };
}));
