/**
 * jQuery Filtrify v0.2
 * Beautiful advanced tag filtering with HTML5 and jQuery
 * http://luis-almeida.github.com/filtrify
 *
 * Licensed under the MIT license.
 * Copyright 2012 Luís Almeida
 * https://github.com/luis-almeida
 */

;(function ( $, window, document, undefined ) {

   var defaults = {
      noresults : "No results match",
      hide : true,
      block : [],
      blockFieldMenu: [],
      close : false,
      query : undefined, // { category : [tags] } }
      callback : undefined // function ( query, match, mismatch ) {}
   }; 

   function Filtrify( containerID, placeholderID, options ) {

      this.options = $.extend({}, defaults, options) ;

      this._container = $( "#" + containerID );
      this._holder = $( "#" + placeholderID );
      this._items = this._container.children();
      this._matrix = [];
      this._fields = {};
      this._order = []; // helper to get the right field order
      this._search = {};
      this._menu = {};
      this._query = {};
      this._match = [];
      this._mismatch = [];
      this._z = 9999;

      this._bind = function ( fn, me ) { 
         return function () { 
            return fn.apply( me, arguments ); 
         }; 
      };
      
      this.init();

   };

   Filtrify.prototype.init = function () {
      this.load();
      this.set();

      if ( this.options.query !== undefined ) { 
         this.trigger( this.options.query );
      };
   };

   Filtrify.prototype.load = function () {
      var attr, i, name, field, tags, data, t;

      this._items.each( this._bind( function( index, element ) {

         attr = element.attributes;
         data = {};

         for ( i = 0 ; i < attr.length; i++ ) {
            name = attr[i].name;
            if ( name.indexOf( "data-" ) === 0 && $.inArray( name, this.options.block ) === -1 ) {
               field = name.replace(/data-/gi, "").replace(/-/gi, " ");
               tags = element.getAttribute( name ).split(", ");
               data[field] = tags;

               if ( this._fields[field] === undefined ) {
                  this._order.push(field);
                  this._fields[field] = {};
               };

               for ( t = 0; t < tags.length; t++ ) {
                  if ( tags[t].length ) {
                     tags[t] = tags[t].replace(/\\/g, "");
                     this._fields[field][tags[t]] = this._fields[field][tags[t]] === undefined ?
                        1 : this._fields[field][tags[t]] + 1;
                  };
               };
            };
         };
         
         /*
         $(element).on('opec-toggle-selected', 'a', function() {
            $(this).find(".ui-icon")
               .toggleClass("ui-icon-plus ui-icon-minus")
            .end()
            .toggleClass('opec-selected opec-unselected')
            .toggleClass('ui-state-highlight');
         });
         */

         this._matrix.push( data );

      }, this ) );
   };

   Filtrify.prototype.set = function () {
      var f = 0, field,
         browser = $.browser,
         self = this;

      this._search.element = $('<ul class="opec-search"><input type="text" placeholder="Search" /></ul>');
      this.createSearch();
      this._menu.list = $('<ul class="ft-menu" />');

      for ( f; f < this._order.length; f++ ) {
         field = browser.webkit || browser.opera ? 
            this._order[f] : this._order[ this._order.length - f - 1 ];
            
         this._menu[ field ] = {};
         this.build( field );
         this.cache( field );
         this.events( field );
         this.append( field );
         this.query( field );
         
         if($.inArray(field, this.options.blockFieldMenu) !== -1) {
            this._menu[field].item.hide();
         }
      };

      this._holder.html(self._menu.list).prepend(this._search.element);
   };

   Filtrify.prototype.build = function ( f ) {
      var html, t, tag, tags = [];
         
      html = '<li class="ft-field">' + 
         '<h3 class="ft-label">' + 
            '<a href="#">' + f + '</a>' + 
         "</h3>" + 
         '<div class="ft-panel ft-hidden">' +
            '<ul class="ft-selected" style="display:none;"></ul>' +
            //"<fieldset class='ft-search'><input type='text' placeholder='Search' /></fieldset>" +
            '<ul class="ft-tags">';

      for ( tag in this._fields[f] ) {
         tags.push( tag );
      };

      tags.sort();

      for ( t = 0; t < tags.length; t++ ) {
         tag = tags[t];
         html += '<li class="ui-state-default" data-count="' + this._fields[f][tag] + '" ><span>' + tag + '</span></li>';
      };

      html += "</ul><div class='ft-mismatch ft-hidden'></div></div></li>";

      this._menu[f].item = $(html).multiOpenAccordion({
         active: 0
      });
   };

   Filtrify.prototype.cache = function ( f ) {
      this._menu[f].label = this._menu[f].item.find("span.ft-label");
      this._menu[f].panel = this._menu[f].item.find("div.ft-panel");
      this._menu[f].selected = this._menu[f].item.find("ul.ft-selected");
      this._menu[f].search = this._menu[f].item.find("fieldset.ft-search");
      this._menu[f].tags = this._menu[f].item.find("ul.ft-tags");
      this._menu[f].mismatch = this._menu[f].item.find("div.ft-mismatch");

      this._menu[f].highlight = $([]);
      this._menu[f].active = $([]);
   };

   Filtrify.prototype.append = function ( f ) {
      this._menu.list.append( this._menu[f].item );
   };

   Filtrify.prototype.query = function ( f ) {
      this._query[f] = [];
   };

   Filtrify.prototype.events = function ( f ) {
      var self = this;
/*
      $( document ).on("click", this._bind(function(){
         this.closePanel( f );
      }, this) );

      this._menu[f].panel.on("click", this._bind(function(event){
         event.stopPropagation();
      }, this) );

      this._menu[f].panel.on("mouseenter", this._bind(function(){
         this.bringToFront( f );
      }, this) );

      this._menu[f].label.on("click", this._bind(function(event){
         this.openPanel( f );
         this.bringToFront( f );
         event.stopPropagation();
      }, this) );
      
      this._menu[f].search.on( "keyup", "input", this._bind(function(event) {

         if ( event.which === 38 || event.which === 40 ) { 
            return false; 
         } else if ( event.which === 13 ) {
            if ( this._menu[f].highlight.length ) {
               this.select( f );
               this.filter();
            };
         } else {
            this.search( f, event.target.value );
         };

      }, this) );

      this._menu[f].search.on( "keydown", "input", this._bind(function(event) {

         if( event.which === 40 ) {
            this.moveHighlight( f, "down" );
            event.preventDefault();
         } else if ( event.which === 38 ) {
            this.moveHighlight( f, "up" );
            event.preventDefault();
         };

      }, this) );
      
*/

      this._menu[f].tags.on( "mouseenter", "li", function(event) {
         self.highlight( f, $(this) );
      });

      this._menu[f].tags.on( "mouseleave", "li", function() {
         self.clearHighlight( f );
      });

      
      this._menu[f].tags.on( "click", "li", function() {
         self.select( f );
         self.filter();
         // OPEC: using jQuery ui classes for style on selection
         //$(this).addClass('ui-state-highlight');
      });

      this._menu[f].selected.on( "click", "li", function(event){
         self.unselect( f, $( event.target ).text() );
         self.filter();
         // OPEC: using jQuery ui classes for style on selection
         //$(this).removeClass('ui-state-highlight')
      });

   };
   
   Filtrify.prototype.createSearch = function() {
      
      this._search.results = [];
      
      var searchInput = this._search.element.children('input'),
         field = 'name';
    
      this._search.element.on( "keyup", "input", this._bind(function(event) {
         if ( event.which === 38 || event.which === 40 ) { 
            return false; 
         //} else if ( event.which === 13 ) {
            //if ( this._menu['provider'].highlight.length ) {
               //this.select('provider');
               //this.filter();
            //};
         } else {
            
            //if(typeof this._search.term !== 'undefined' && this._search.term !== null)
               //this.updateQueryTags( 'name', this._search.term);
            
            this.resetSearch(field);
            this._search.term = $.trim( event.target.value.toLowerCase() );
            this.search('name', this._search.term );
            
            //this._fields['name'] = {};
            //this._fields['name'][event.target.value] = 1;
            
            this.filter();
            
         };

      }, this) );

      this._search.element.on( "keydown", "input", this._bind(function(event){

         //if( event.which === 40 ) {
            //this.moveHighlight( f, "down" );
            //event.preventDefault();
         //} else if ( event.which === 38 ) {
            //this.moveHighlight( f, "up" );
            //event.preventDefault();
         //};

      }, this) );
   }
/*
   Filtrify.prototype.bringToFront = function ( f ) {
      this._z = this._z + 1;
      this._menu[f].panel.css("z-index", this._z);
      this._menu[f].search.find("input").focus();
   };

   Filtrify.prototype.openPanel = function ( f ) {
      this._menu[f].label.toggleClass("ft-opened");
      this._menu[f].panel.toggleClass("ft-hidden");
      this._menu[f].search.find("input").focus();
      console.log("Panel Open")
   };

   Filtrify.prototype.closePanel = function ( f ) {
      //this.resetSearch( f );
      this._menu[f].panel.addClass("ft-hidden");
      this._menu[f].label.removeClass("ft-opened");
      console.log("Panel Close")
   };
*/
   Filtrify.prototype.preventOverflow = function ( f ) {
      var high_bottom, high_top, maxHeight, visible_bottom, visible_top;

      maxHeight = parseInt(this._menu[f].tags.css("maxHeight"), 10);
      visible_top = this._menu[f].tags.scrollTop();
      visible_bottom = maxHeight + visible_top;
      high_top = this._menu[f].highlight.position().top + this._menu[f].tags.scrollTop();
      high_bottom = high_top + this._menu[f].highlight.outerHeight();
      if (high_bottom >= visible_bottom) {
         return this._menu[f].tags.scrollTop((high_bottom - maxHeight) > 0 ? high_bottom - maxHeight : 0);
      } else if (high_top < visible_top) {
         return this._menu[f].tags.scrollTop(high_top);
      }
   };

   Filtrify.prototype.moveHighlight = function ( f, direction ) {
      if ( this._menu[f].highlight.length ) {
         var method = direction === "down" ? "nextAll" : "prevAll",
            next = this._menu[f].highlight[method](":visible:first");
         if ( next.length ) {
            this.clearHighlight( f );
            this.highlight( f, next );
            this.preventOverflow( f );
         };
      } else {
         this.highlight( f, this._menu[f].tags.children(":visible:first") );
         this.preventOverflow( f );
      };
   };

   Filtrify.prototype.highlight = function ( f, elem ) {
      this._menu[f].highlight = elem;
      // OPEC: changed to use jQuery ui classes for hover over.
      this._menu[f].highlight.addClass("ui-state-hover");
   };

   Filtrify.prototype.removeHighlight = function ( f ) {
      // OPEC: changed to use jQuery ui classes for hover over.
      this._menu[f].highlight.removeClass("ui-state-hover");
   };

   Filtrify.prototype.hideHighlight = function ( f ) {
      this._menu[f].highlight.addClass("ft-hidden");
   };

   Filtrify.prototype.resetHighlight = function ( f ) {
      this._menu[f].highlight = $([]);
   };

   Filtrify.prototype.clearHighlight = function ( f ) {
      this.removeHighlight( f );
      this.resetHighlight( f );
   };

   Filtrify.prototype.showMismatch = function ( f, txt ) {
      this._menu[f].mismatch
         .html( this.options.noresults + " \"<b>" + txt + "</b>\"")
         .removeClass("ft-hidden");
   };

   Filtrify.prototype.hideMismatch = function ( f ) {
      this._menu[f].mismatch.addClass("ft-hidden");
   };

   Filtrify.prototype.search = function ( field, term ) {
      //this.clearHighlight( f );
      //this.showResults( f, txt );
      //this.highlight( f, this._menu[f].tags.children(":visible:first") );
      
      for (var tag in this._fields[field]) {
         if(tag.toLowerCase().indexOf(term) >= 0 ) {
            this._search.results.push(tag);
         }
      }
      
      // OPEC: If search results are empty we need to add a unique tag to
      // clear the box.
      if(this._search.results.length == 0) {
         this._search.results.push('zzzzzzzzzz');
      }
      
      for (var i = 0, len = this._search.results.length; i < len; i++) {
         this.updateQueryTags( field, this._search.results[i]);
      }
      
      // self._search.results[i]
   };

   Filtrify.prototype.resetSearch = function ( field ) {
      //this._menu[f].search.find("input").val("");
      //this._menu[f].tags.children()
         //.not(this._menu[f].active)
         //.removeClass("ft-hidden");

      //this.hideMismatch( f );
      
      for (var i = 0, len = this._search.results.length; i < len; i++) {
         this.updateQueryTags( field, this._search.results[i]);
      }
      
      this._search.results = [];
      
   };

   Filtrify.prototype.showResults = function ( f, txt ) {
      var results = 0;

      this.hideMismatch( f );

      this._menu[f].tags
         .children()
         .not(this._menu[f].active)
         .each(function() {
            if ( ( this.textContent || this.innerText ).toUpperCase().indexOf( txt.toUpperCase() ) >= 0 ) {
               $(this).removeClass("ft-hidden");
               results = results + 1;
            } else {
               $(this).addClass("ft-hidden");
            };
         });

      if ( !results ) {
         this.showMismatch( f, txt );
      };
   };

   Filtrify.prototype.select = function ( f ) {
      this.updateQueryTags( f, this._menu[f].highlight.text() );
      this.updateActiveClass( f );
      this.removeHighlight( f );
      this.appendToSelected( f );
      this.addToActive( f );
      this.hideHighlight( f );
      this.resetHighlight( f );
      //this.resetSearch( f );

      //if ( this.options.close ) {
         //this.closePanel( f );
      //};
   };
   
   /**
    * Adds tags to fields to be used to make up a search query.
    * 
    * @param {Object} f - The field to add the tag to.
    * @param {Object} tag - The tag to add to the field.
    */
   Filtrify.prototype.updateQueryTags = function ( f, tag ) {
      var index = $.inArray( tag, this._query[f] );

      if ( index === -1 ) {
         this._query[f].push( tag );
      } else {
         this._query[f].splice( index, 1 );
      };
   };

   /**
    * Adds 'ft-active' class onto fields.
    * 
    * @param {Object} f - The field to update.
    */
   Filtrify.prototype.updateActiveClass = function ( f ) {
      if ( this._query[f].length ) {
         this._menu[f].label.addClass("ft-active");
      } else {
         this._menu[f].label.removeClass("ft-active");
      };
   };

   /**
    * Clones and then appends the selected tag onto the selected element of 
    * that field.
    * 
    * @param {Object} f - The field of whose selected element to use.
    */
   Filtrify.prototype.appendToSelected = function ( f ) {
      this._menu[f].selected.append( this._menu[f].highlight.clone().addClass('ui-state-highlight') );
      this._menu[f].highlight.hide();
      this.slideSelected( f );
   };

   /**
    * Adds the element to the active object.
    * Slightly confusingly 'active' is a jQuery object not a javascript array.
    * @param {Object} f - The field
    */
   Filtrify.prototype.addToActive = function ( f ) {
      this._menu[f].active = this._menu[f].active.add( this._menu[f].highlight );
   };
    
   /**
    * Unselects the tag from the field.
    * 
    * @param {Object} f - The field to unselect from.
    * @param {Object} tag - The tag to unselect.
    */
   Filtrify.prototype.unselect = function ( f, tag ) {
      this.updateQueryTags( f, tag );
      this.removeFromSelected( f, tag );
      this.removeFromActive( f, tag );
      this.updateActiveClass( f );
      //this.resetSearch( f );
   };
   
   /**
    * Remove tag from the selected element and unhide the unselected version. 
    * 
    * @param {Object} f - The field to remove the tag from.
    * @param {Object} tag - The tag to remove. 
    */
   Filtrify.prototype.removeFromSelected = function ( f, tag ) {
      this._menu[f].selected
         .children()
         .filter(function() { 
            return ( this.textContent || this.innerText ) === tag; 
         })
         .remove();
         
      this._menu[f].tags
         .find(':hidden')
         .filter(function() {
            return ( this.textContent || this.innerText ) === tag;
         })
         .show();

      this.slideSelected( f );
   };

   /**
    * Remove from active list.
    * 
    * @param {Object} f - The field.
    * @param {Object} tag - The tag.
    */
   Filtrify.prototype.removeFromActive = function ( f, tag ) {
      this._menu[f].active = this._menu[f].active.filter(function() { 
         return ( this.textContent || this.innerText ) !== tag; 
      });
   };

   Filtrify.prototype.slideSelected = function ( f ) {
      if ( this._menu[f].selected.children().length ) {
         this._menu[f].selected.slideDown("fast");
      } else {
         this._menu[f].selected.slideUp("fast");
      };
   };

   Filtrify.prototype.filter = function () {
      var f, r, t, c, m;

      this.resetCachedMatch();

      for ( r = this._matrix.length - 1; r >= 0; r-- ) {
         m = true;
         for ( f in this._query ) {
            c = 0;          
            for ( t = this._query[f].length - 1; t >= 0; t-- ) {
               if ( $.inArray( this._query[f][t], this._matrix[r][f] ) !== -1 ) {
                  c = c + 1;
               };
            };

            if ( !this._query[f].length  || c > 0 ) {
               // match!
            } else { 
               m = false; 
            };

         };
         
         this.updateFields( r, m );
         this.cacheMatch( r, m );
         this.showMatch( r, m );
      };

      this.rewriteFields();

      this.callback();

   };

   Filtrify.prototype.updateFields = function ( row, match ) {
      var field, tags, t;
      
      for ( field in this._fields ) {
         if ( row === this._matrix.length - 1 ) {
            if($.inArray(field, this.options.blockFieldMenu) === -1) {
               this._fields[field] = {};
            }
         };

         tags = this._matrix[row][field];

         if( match && tags ) {

            for ( t = 0; t < tags.length; t++ ) {
               if ( tags[t].length ) {
                  this._fields[field][tags[t]] = this._fields[field][tags[t]] === undefined ?
                     1 : this._fields[field][tags[t]] + 1;
               };
            };

         };
      };

   };

   Filtrify.prototype.rewriteFields = function () {
      var field;
      for ( field in this._fields ) {
         this._menu[field].tags
            .children()
            .each( this._bind( function( index, element ) {
               var tag = ( element.textContent || element.innerText ),
                  count = this._fields[field][tag] === undefined ? 0 : this._fields[field][tag];

               element.setAttribute("data-count", count );
            }, this ) );
      };
   };

   Filtrify.prototype.resetCachedMatch = function () {
      this._match = [];
      this._mismatch = [];
   };

   Filtrify.prototype.cacheMatch = function ( row, match ) {
      if ( match ) {
         this._match.unshift( this._items[row] );
      } else {
         this._mismatch.unshift( this._items[row] );
      };
   };
   
   Filtrify.prototype.refreshCache = function($selection) {
      this._items.each(function(index, element) {
         if($(element).attr('data-id') == $selection.attr('data-id')) {
            element = $selection[0];
            return false; // We could break
         }
      });
      //this._items = this._container.children();
   }

   Filtrify.prototype.showMatch = function ( row, match ) {
      if ( this.options.hide ) {

         var hidden = this._items[row].className.indexOf("ft-hidden") !== -1;

         if ( match ) {
            if ( hidden ) this._items[row].className = this._items[row].className.replace(/ft-hidden/g, "");
         } else {
            if ( !hidden ) this._items[row].className = this._items[row].className + " ft-hidden";
         };
         
      };
   };
    
   Filtrify.prototype.callback = function () {
      if ( this.options.callback !== undefined && $.isFunction( this.options.callback ) ) {
         this.options.callback( this._query, this._match, this._mismatch );
      };
   };

   Filtrify.prototype.trigger = function ( query ) {
      var f;

      for ( f in this._fields ) {
         this.clearSearch( f );
         this.updateQueryField( f, query );
         this.updateActiveClass( f );
         this.updatePanel( f );
         this.toggleSelected( f );
      }; 

      this.filter();
   };

   Filtrify.prototype.clearSearch = function ( f ) {
      //this.clearHighlight( f );
      //this.resetSearch( f );
      //this.clearSelected( f );
   };

   Filtrify.prototype.clearSelected = function ( f ) {
      this._menu[f].selected.empty();
      this._menu[f].active = $([]);
   };

   Filtrify.prototype.updateQueryField = function ( f, query ) {
      this._query[f] = query[f] !== undefined ? query[f] : [];
   };

   Filtrify.prototype.updatePanel = function ( f ) {
      var t = 0, tag,
         tags = this._menu[f].tags.children().removeClass("ft-hidden");

      for ( t; t < this._query[f].length; t++ ) {
         
         tag = tags.filter( this._bind( function( index ) {
            return ( tags[index].textContent || tags[index].innerText ) === this._query[f][t]; 
         }, this ));

         this._menu[f].selected.append( tag.clone() );
         this._menu[f].active = this._menu[f].active.add( tag );
         tag.addClass("ft-hidden");
      };
   };

   Filtrify.prototype.toggleSelected = function ( f ) {
      if ( this._menu[f].selected.children().length ) {
         this._menu[f].selected.show();
      } else {
         this._menu[f].selected.hide();
      };
   };

   Filtrify.prototype.reset = function() {
      this.trigger({});
   };
   

   $.filtrify = function( containerID, placeholderID, options ) {
      return new Filtrify( containerID, placeholderID, options );
   };
   
})(jQuery, window, document);