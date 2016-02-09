function gpsReceiver(name, deps) 
{
  // Instance variables
  this.deps 	= deps; 	// hold a reference to the plugin dependencies if you are going to use them
  this.rov 	= deps.rov; 	// explicitlly calling out the rov eventemitter
  this.cockpit 	= deps.cockpit; // explicitly calling out cockpit eventemitter
  
  var gpsd = require( 'gpsd' );
   
  var isConnecting = false;
  var automaticallyReconnect = true;
  var reconnectTimer;
  
  var listener = new gpsd.Listener(
  {
    port: 2947,
    hostname: '192.168.254.210',
    logger: 
    {
      info: function() {},
      warn: console.warn,
      error: console.error
    },
    parse: true
  } ); 
}

gpsReceiver.prototype.start = function start()
{
  // Register callbacks for events emitted by the listener
  registerListenerEvents();

  // Start attempts to connect to gpsd
  connectToGpsd();
}

gpsReceiver.prototype.registerListenerEvents = function()
{
  var self = this;

  // GPSD Event Listeners
  self.listener.on( 'TPV', function( data ) 
  {
    self.cockpit.emit( 'plugin.gpsReceiver.TPV', data );
  });
  
  self.listener.on( 'SKY', function( data ) 
  {
    self.cockpit.emit( 'plugin.gpsReceiver.SKY', data );
  });
  
  self.listener.on( 'GST', function( data ) 
  {
    self.cockpit.emit( 'plugin.gpsReceiver.GST', data );
  });
  
  self.listener.on( 'ATT', function( data ) 
  {
    self.cockpit.emit( 'plugin.gpsReceiver.ATT', data );
  });

  // Connection Event listeners  
  self.listener.on( 'connected', function( data ) 
  {
    console.log( 'gpsReceiver - Connected to gpsd!' );
    self.cockpit.emit( 'plugin.gpsReceiver.connected' );
  });
  
  self.listener.on( 'disconnected', function( data ) 
  {
    console.log( 'gpsReceiver - Disconnected from gpsd: ' + data );
    self.cockpit.emit( 'plugin.gpsReceiver.disconnected' );
    
    // Retry in 10 seconds
    setTimeout( function()
    {
      if( self.automaticallyReconnect )
      {
	self.connectToGpsd();
      }
    }, 10000 );
  });
  
  self.listener.on( 'error', function( data ) 
  {
    console.log( 'gpsReceiver - Error occurred: ' + data );
    
    // Clear the reconnect timer, if we aren't configured to reconnect
    if( !self.automaticallyReconnect && self.reconnectTimer )
    {
	clearInterval( self.reconnectTimer );
    }
  });
};

gpsReceiver.prototype.connectToGpsd = function()
{
    console.log( 'gpsReceiver - Attempting to connect to gpsd...' );

    // Start the connection
    self.listener.connect( function() 
    {
      // On successful connect, announce ourselves as a watcher to GPSD
      self.listener.watch();

    } ); 
};

module.exports = function( name, deps ) 
{
  return new gpsReceiver( name, deps );
};
