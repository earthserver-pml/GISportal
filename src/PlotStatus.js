
/**
 * The PlotStatus object is used to display a small view of a plot.
 * It will be used on the history panel.
 * After a plot is made or loaded from the server it will give given
 * one of these views and added to the history panel.
 * This interfaces with the Plot object to allow the user to:
 *  - Save or unsave the plot
 *  - View the status of it, downloading, complete, expired, etc...
 *  - Open the plot or possibly see download methods
 * 
 */
gisportal.graphs.PlotStatus = (function(){

   /**
    * Creates a new PlotEditor object which will edit a plot object
    *
    * @param {Plot} plot The plot object to edit
    */
   var PlotStatus = function( plot ){
      this._plot = plot;

      //Setup
      this.rebuildElement();
      this.setupPlotStatusChange();
   };
    /**
     * Rebuilds the UI in the status element
     * Is normally called when the plot api
     * says the status of the plot has changed
     */
   PlotStatus.prototype.rebuildElement = function(){
      // Get the plot
      var plot = this.plot();

      // Generate the HTML template
      var rendered = gisportal.templates['plot-status']( plot );

      // Convert it to a dom element
      var newElement = $(rendered);

      // Get the state used in the HTML
      // IE, success, error, processing
      this.renderedState = plot.state();

      // Replace the HTML in the dom if needed
      if( this._element )
         this._element.replaceWith( newElement );

      // Store the new element
      this._element = newElement;
      newElement.data('plot', plot);

      // Add listeners to the buttons that
      // maybe in the dom
      this._element
         // Delete a plot
         .on('click', '.js-graph-status-delete', function(){
            $(this).closest('.graph-job').remove();
         })
         // Copy a plot
         .on('click', '.js-graph-status-copy', function(){
            gisportal.graphs.editPlot( plot.copy() );
         })
         // Open a plot
        .on('click', '.js-graph-status-open', function(){
            // Get the URL for that plot
            var interactiveUrl = plot.interactiveUrl();
            // Open it in a pop up
            window.open( interactiveUrl, '', 'width=' + window.innerWidth * 0.90 + ',height=' + window.innerHeight * 0.70  + ',toolbar=no' );
         });
   };

   /**
    * Setup a listener so that if the state
    * on the plot changes we can handle the
    * event and update the UI
    */
   PlotStatus.prototype.setupPlotStatusChange = function(){
      var _this = this;

      this.plot().on('serverStatus-change', function( data ){
         var serverStatus = data['new'];
         switch( serverStatus.state ){
            case "success":
               _this.stateSuccess( serverStatus );
               break;
            case "processing":
            case "testing":
               _this.stateProcessing( serverStatus );
               break;
            case "error":
               _this.stateError( serverStatus );
               break;
         };
      });
   };

   /**
    * Handles what to do if the plots state
    * becomes an error.
    *
    * It reloads the state html block and adds
    * a listener to the Show Full Error button
    * which shows the full error from the server
    * 
    * @param  Object serverStatus The status as returned
    *                             from the server
    */
   PlotStatus.prototype.stateError = function( serverStatus ){

      if( this.renderedState != "error" )
         this.rebuildElement();

      var message = serverStatus.message;
      this._element
         .find('.js-graph-status-show-full-error')
         .click(function(){
            alert( message );
         });
   };

   /**
    * Handles what to do if the plots state
    * becomes an success.
    *
    * It just reloads the state element
    * 
    * @param  Object serverStatus The status as returned
    *                             from the server
    */
   PlotStatus.prototype.stateSuccess = function( serverStatus ){

      if( this.renderedState != "success" )
         this.rebuildElement();

   };

   /**
    * When a Plot request is sent away the plot returns status
    * messages about how the progress of the graph on the server
    *
    * This function handles the processing state.
    * It will update the status element do some final calculations
    * on estimating the completion time from the information
    * the server has given.
    * 
    * @param  Object serverStatus The status as returned
    *                             from the server
    */
   PlotStatus.prototype.stateProcessing = function( serverStatus ){
      var isCalculating = false;
      var hasEstimation = false;
      var worestCaseEstimation = new Date();

      // Rebuild the element if we arent already showing
      // the processing template
      if( this.renderedState != "processing" )
         this.rebuildElement();

      // Loop over all of sources and find the longest
      // estimation time. This will be the one thats 
      // said to be the Plots completion time
      for( var sourceId = 0; sourceId < serverStatus.sources.length; sourceId++ ){
         var source = serverStatus.sources[ sourceId ];

         switch( source.estimation.state ){
            case "calculating":
               isCalculating = true;
               break;
            case "success":
               hasEstimation = true;
               var estimatedEst = new Date( source.estimation.endTime );
               if( estimatedEst.getTime() > worestCaseEstimation.getTime() )
                  worestCaseEstimation = estimatedEst;
               break;

         };
      };

      var message = serverStatus.message;

      // Decide what the estimated completion 
      // time message should be
      if( isCalculating && ! hasEstimation )
         message += "<br>Estimated time remaining: calculating";
      if( hasEstimation )
         message += "<br>Estimated time remaining: " + this.printSmallTimeDiffernce( worestCaseEstimation ) ;

      // Add the message to the status element
      this._element
         .find('.js-message')
         .html( message );
   };

   /**
    * Takes in a Date object and return the differnce between then and now
    * in the format of **m**s
    * @param  Date endTime           The time to take the differnce between
    * @param  Boolean allowNegative  If true it can return minus numbers, if false it stops at 0m0s
    * @return String
    */
   PlotStatus.prototype.printSmallTimeDiffernce = function( endTime, allowNegative ){
      var allowNegative = allowNegative || false;
      var startTime = new Date();

      var differnceInSecs = ( endTime.getTime() - startTime.getTime() ) / 1000;

      if( ! allowNegative && differnceInSecs == 0 )
         return "0m0s";

      var flip = false;
      if( differnceInSecs < 0 ){
         flip = true;
         differnceInSecs = Math.abs( differnceInSecs );
      }

      var minutes  = Math.floor(differnceInSecs / 60);
      var seconds  = Math.floor(differnceInSecs % 60);

      var output = flip ? "-":"+";

      output += minutes + "m";
      output += seconds + "s";

      return output;
   }

   // Getter themes

   // Gets the HTML for the dom
   PlotStatus.prototype.element = function(){
      return this._element;
   };

   // Get the plot this View is associated with
   PlotStatus.prototype.plot = function(){
      return this._plot;
   };


   return PlotStatus;
})();
