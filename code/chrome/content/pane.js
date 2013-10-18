
// Make a namespace.
if (typeof Trackman == 'undefined') {
  var Trackman = {};
}

// Shorthand
if (typeof(Cc) == "undefined")
  var Cc = Components.classes;
if (typeof(Ci) == "undefined")
  var Ci = Components.interfaces;
if (typeof(Cu) == "undefined")
  var Cu = Components.utils;
if (typeof(Cr) == "undefined")
  var Cr = Components.results;
if (typeof(gMM) == "undefined")
    var gMM = Cc["@songbirdnest.com/Songbird/Mediacore/Manager;1"]
             .getService(Ci.sbIMediacoreManager);


Cu.import("resource://app/jsmodules/sbProperties.jsm");
Cu.import("resource://app/jsmodules/sbLibraryUtils.jsm")
Cu.import("resource://app/jsmodules/sbMetadataUtils.jsm");

var re_canta = new RegExp("[Cc][Aa][Nn][Tt][Aa]");
var re_with = new RegExp( "[wW][Ii][Tt][Hh]");
var re_con = new RegExp( "[Cc][Oo][Nn]");
var re_featuring = new RegExp( "[Ff][Ee][Aa][Tt][Uu][Rr][Ee][Ii][Nn][Gg]");
var re_feat = new RegExp( "[Ff][Ee][Aa][Tt]\.");

/**
 * Controller for pane.xul
 */
Trackman.PaneController = {

  /**
   * Called when the pane is instantiated
   */
  onLoad: function() {
    this._initialized = true;
    this._mainWindow = top; // if we are a sidebar?

    // Make a local variable for this controller so that
    // it is easy to access from closures.
    var controller = this;

    // Hook up the action button
    this._button = document.getElementById("action-button");
    this._button.addEventListener("command",
         function() { controller.loadHelpPage(); }, false);

    this._clear_button = document.getElementById("clear-button");
    this._clear_button.addEventListener("command",
         function() { controller.clear(); }, false);

    this._doit_button = document.getElementById("doit");
    this._doit_button.addEventListener("command",
         function() { controller.doit(); }, false);

    this.checkboxes = {}
    this.checkboxes.swap_AA_A = document.getElementById("Swap-AA-A");
    this.checkboxes.AA_from_artist = document.getElementById("AA-from-artist");
    this.checkboxes.clear_A_if_match = document.getElementById("clear-A-if-match");
    this.checkboxes.A_from_track = document.getElementById("A-from-track");
    this.checkboxes.AA_from_track = document.getElementById("AA-from-track");
    this.checkboxes.composer_from_track = document.getElementById("composer-from-track");
    this.checkboxes.AA_lastname_first = document.getElementById("AA-lastname-first");
    this.checkboxes.A_lastname_first = document.getElementById("A-lastname-first");
    this.checkboxes.production_year_on_title = document.getElementById("production-year-on-title");
    this.checkboxes.nothing_from_track = document.getElementById("nothing-from-track");

    this.checkboxes.clear_radio_field = document.getElementById("clear-radio-field");

    this.checkboxes.onlyempty = document.getElementById("onlyempty");

    this.textboxes = {}
    this.textboxes.replace_regex = document.getElementById("replace-regex" );
    this.textboxes.replace_string = document.getElementById("replace-string" );
    this.textboxes.insert_string = document.getElementById("insert-string" );
    this.textboxes.append_string = document.getElementById("append-string" );

    this.fieldradio = {}
    this.fieldradio.A = document.getElementById("A-radio");
    this.fieldradio.AA = document.getElementById("AA-radio");
    this.fieldradio.track = document.getElementById("track-radio");
    this.fieldradio.genre = document.getElementById("genre-radio");
    this.fieldradio.album_title = document.getElementById("album-title-radio");
    this.fieldradio.composer = document.getElementById("composer-radio");
    this.fieldradio.comment = document.getElementById("comment-radio");
    this.fieldradio.description  = document.getElementById("description-radio");
    this.fieldradio.nothing  = document.getElementById("nothing-radio");

  },

  /**
   * Called when the pane is about to close
   */
  onUnLoad: function() {
    this._initialized = false;
  },


  clear: function(){
       this.checkboxes.swap_AA_A.setAttribute("checked", "false");
       this.checkboxes.AA_from_artist.setAttribute("checked", "false");
       this.checkboxes.clear_A_if_match.setAttribute("checked", "false");
       //this.checkboxes.AA_lastname_first.setAttribute("checked", "false");
       //this.checkboxes.AAA_lastname_first.setAttribute("checked", "false");
       //this.checkboxes.A_lastname_first.setAttribute("checked", "false");
       this.checkboxes.production_year_on_title.setAttribute("checked", "false");
       this.checkboxes.onlyempty.setAttribute("checked", "false");

       //Reset the extract from track radio buttons.
       document.getElementById("track-radio").selectedItem =
                document.getElementById("nothing-from-track");

       this.textboxes.replace_regex.reset();
       this.textboxes.replace_string.reset();
       this.textboxes.insert_string.reset();
       this.textboxes.append_string.reset();

       this.checkboxes.clear_radio_field.setAttribute("checked", "false");

       //Reset the radio fields selection.
       document.getElementById("radio-fields").selectedItem =
                document.getElementById("nothing-radio");
  },

  doit: function() {
    this.onlyempty = this.checkboxes.onlyempty.getAttribute("checked");

    // loop over selected tracks, process each one.
    this.mediaListView = this._mainWindow.gBrowser.currentMediaListView;
    var selection = this.mediaListView.selection;
    var count = selection.count;
    this.selected_tracks = selection.selectedMediaItems;
    // keep track of what we changed.
    this.tracks_we_changed = [];
    // we have to keep track of the properties we need to write.
    this.writeProperties = [];

    //alert("About to process: " + count + " Records.");
    for (var i=0;i<count;i++)
    {
      this.current_item = this.selected_tracks.getNext();
      this.process_track();
      this.tracks_we_changed.push(this.current_item);
    }

    if (this.tracks_we_changed.length > 0 && this.writeProperties.length > 0) {
      sbMetadataUtils.writeMetadata(this.tracks_we_changed,
                                    this.writeProperties,
                                    window,
                                    this.mediaListView.mediaList);
    }

  },

  process_track: function(){

    // Swap album artist and artist.
    if(this.checkboxes.swap_AA_A.getAttribute("checked") == "true"){
        this.Swap_album_artist_and_artist()
    }

    // Parse Artist for Album artist and artist.
    if(this.checkboxes.AA_from_artist.getAttribute("checked") == "true"){
        this.Split_artist_into_artist_and_album_artist();
    }

    // Clear artist if artist and album artist match
    if(this.checkboxes.clear_A_if_match.getAttribute("checked") == "true"){
        this.clear_artist_if_album_artist_matches();
    }

    // Get stuff from the track name.
    if(this.checkboxes.A_from_track.selected == true){
        this.Split_track_into_track_and_artist();
    }
    if(this.checkboxes.AA_from_track.selected == true){
        this.Split_track_into_track_and_album_artist();
    }
    if(this.checkboxes.composer_from_track.selected == true){
        this.Split_track_into_track_and_composer();
    }

    // fix last name first.
    /*
    if(this.checkboxes.AA_lastname_first.getAttribute("checked") == "true"){
        this.Fix_lastname_first(SBProperties.albumArtistName);
    }
    if(this.checkboxes.A_lastname_first.getAttribute("checked") == "true"){
        this.Fix_lastname_first(SBProperties.artistName);
    }
    if(this.checkboxes.AAA_lastname_first.getAttribute("checked") == "true"){
        this.Fix_lastname_first(SBProperties.albumArtistName);
        this.Fix_lastname_first(SBProperties.artistName);
    }
    */


    // copy year onto end of title.
    if(this.checkboxes.production_year_on_title.getAttribute("checked") == "true"){
        this.Move_year_to_end_of_title();
    }

    //process replace, insert, append.
    if(this.fieldradio.nothing.getAttribute.selected != true){

        //regex replace
        // see if we have a regex and a replacement.
        // or maybe just a regex then we can use it to delete text.
        if(this.textboxes.replace_regex.value.length ){
            this.replace_with_regex(this.get_radio_property());
        }

       // Insert string.
       if(this.textboxes.insert_string.value.length){
            this.insert_string(this.get_radio_property());
       }

       // Append string.
       if(this.textboxes.append_string.value.length){
            this.append_string(this.get_radio_property());
       }

       if(this.checkboxes.clear_radio_field.getAttribute.selected == true){
            this.clear_field(this.get_radio_property());
       }
    }

  },


  // Helper functions ================================================
  set_property: function(property, value){
      // if only empty is checked then bail if the field isn't empty.
      if(this.checkboxes.onlyempty.getAttribute("checked") == "true"){
          var test_value = this.current_item.getProperty(property);
          if (test_value != null) // || test_value.length)
              return
      }

      // set the property.
      this.current_item.setProperty(property, value);
      // keep track of the properties that have changed.
      this.writeProperties.push(property);

  },

  get_radio_property: function(string){
       if(this.fieldradio.A.selected == true)
         return(SBProperties.artistName);

       if(this.fieldradio.AA.selected == true)
         return(SBProperties.albumArtistName);

       if(this.fieldradio.track.selected == true)
         return(SBProperties.trackName);

       if(this.fieldradio.genre.selected == true)
         return(SBProperties.genre);

       if(this.fieldradio.album_title.selected == true)
         return(SBProperties.albumName);

       if(this.fieldradio.composer.selected == true)
         return(SBProperties.composerName);

       if(this.fieldradio.comment.selected == true)
         return(SBProperties.comment);

       if(this.fieldradio.description.selected == true)
         return(SBProperties.description);

       if(this.fieldradio.nothing.selected == true)
         return(null);
  },

  find_orchestra_and_artist: function(string){

        var split_value = this.find_artist_in_string(string);

        split_value[0] = this.fix_first_last(split_value[0]);

        return (split_value);
  },



  fix_first_last: function(name){
        // split, reverse and join with a space between.
        // return(' '.join(name.split(',')[::-1]))
        if (name.length && name.indexOf(',') != -1){
            var split_name = name.split(',');
            // Need to remove leading and trailing spaces on the pieces.
            var newname = "";
            var count = split_name.length;
            for (var i=count;i>0;i--){
                if (i < count)
                    newname = newname + " ";
                newname = newname + split_name[i-1].trim()
            }

            return (newname);
        } else
            return (name);
  },

  find_artist_in_string: function(string){
      //orchestra followed by  with/con/Canta/featuring/feat./(singer)
      var artist = string;
      var parts= [];
      // get rid of with/con/Canta/featuring/feat. replace with |.
      artist = artist.replace( re_canta, '|');
      artist = artist.replace( re_with, '|');
      artist = artist.replace( re_con, '|');
      artist = artist.replace( re_featuring, '|');
      artist = artist.replace( re_feat, '|');

      // found one of those. get rid of the () and split it.
      if (artist.indexOf('|') != -1){
         //split it.
          artist=artist.replace( '(', '' );
          artist = artist.replace( ')', '' )
          artist = artist.replace( '[', '|' )
          artist = artist.replace( ']', '' )
          artist=artist.replace( ':', '' );
          parts=artist.split('|');
      // try to split it at the (,[ or - and get rid of the ) and ].
      }else{
          artist = artist.replace( '-', '|' )
          artist = artist.replace( '[', '|' )
          artist = artist.replace( '(', '|' )
          artist = artist.replace( ')', '' )
          artist = artist.replace( ']', '' )
          //split it.
          parts=artist.split('|');
      }

      parts[0] = parts[0].trim();

      if (parts.length > 1)
          parts[1] = parts[1].trim();

      return(parts);
  },
  // End Helper functions ================================================

  Swap_album_artist_and_artist: function() {
      var albumArtist = this.current_item.getProperty(SBProperties.albumArtistName);
      var artist = this.current_item.getProperty(SBProperties.artistName);

      if (albumArtist)
          this.set_property(SBProperties.artistName, albumArtist);
      else
          this.set_property(SBProperties.artistName, "");

      if (artist)
          this.set_property(SBProperties.albumArtistName, artist);
      else
          this.set_property(SBProperties.albumArtistName, "");
  },

  // Extract album artist and artist from artist. Blank artist if none found.
  // Also fixes lastname, firstname.
  Split_artist_into_artist_and_album_artist: function() {
      var artist = this.current_item.getProperty(SBProperties.artistName);
      var split_value = this.find_orchestra_and_artist(artist);


      this.set_property(SBProperties.albumArtistName, split_value[0]);
      if(split_value.length > 1)
          this.set_property(SBProperties.artistName, split_value[1]);
      else{
          this.set_property(SBProperties.artistName, "");
      }
  },


  //Extract year from comment
  set_year_from_comment: function(){
       var comment = this.current_item.getProperty(SBProperties.comment);
       var year = this.find_number_in_string(comment);
       if (!isNaN(year) && year > 0){
           if (year < 100)
               year = year + 1900;
           this.set_property(SBProperties.year, year);
       }
  },

  clear_artist_if_album_artist_matches: function(){
      var artist = this.current_item.getProperty(SBProperties.artistName);
      var album_artist = this.current_item.getProperty(SBProperties.albumArtistName);

      if (artist == album_artist)
          this.set_property(SBProperties.artistName, "");
  },

  Split_track_into_track_and_artist: function() {
      var string = this.current_item.getProperty(SBProperties.trackName);
      var split_value = this.find_artist_in_string(string)

      //alert("Track: " + split_value[0] + " Artist: " + split_value[1]);

      this.set_property(SBProperties.trackName, split_value[0]);
      if(split_value.length > 1)
          this.set_property(SBProperties.artistName, split_value[1]);
      else
          this.set_property(SBProperties.artistName, "");

  },

  Split_track_into_track_and_album_artist: function() {
      var string = this.current_item.getProperty(SBProperties.trackName);
      var split_value = this.find_artist_in_string(string)

      split_value[1] = this.fix_first_last(split_value[1])

      this.set_property(SBProperties.trackName, split_value[0]);
      if(split_value.length > 1)
          this.set_property(SBProperties.albumArtistName, split_value[1]);
  },

  Split_track_into_track_and_composer: function() {
      var string = this.current_item.getProperty(SBProperties.trackName);
      var split_value = this.find_artist_in_string(string)

      this.set_property(SBProperties.trackName, split_value[0]);
      if(split_value.length > 1)
          this.set_property(SBProperties.composer, split_value[1]);
  },

  Split_track_into_track_and_genre: function() {
      var string = this.current_item.getProperty(SBProperties.trackName);
      var split_value = this.find_artist_in_string(string)

      //alert("Track: " + split_value[0] + " Genre: " + split_value[1]);

      this.set_property(SBProperties.trackName, split_value[0]);
      if(split_value.length > 1)
          this.set_property(SBProperties.genre, split_value[1]);
  },

  Fix_lastname_first: function(property) {
      var value = this.current_item.getProperty(property);
      value = this.fix_first_last(value)

      this.set_property(property, value);
  },

  Move_year_to_end_of_title: function() {
        var albumName = this.current_item.getProperty(SBProperties.albumName);
        var year = this.current_item.getProperty(SBProperties.year);
        albumName = albumName + " (" + year + ")";

        this.set_property(SBProperties.albumName, albumName);
  },

  replace_with_regex: function(property){
        var value = this.current_item.getProperty(property);
        var regex_str = this.textboxes.replace_regex.value;
        var string = this.textboxes.replace_string.value;
        //alert("regex: " + regex_str + "  " + string + " : " + value);

        var regex = new RegExp(regex_str);
        value = value.replace( regex, string);
        this.set_property(property, value);
  },

  insert_string: function(property){
        var value = this.current_item.getProperty(property);
        if (value)
            value = this.textboxes.insert_string.value + " " + value;
        else
            value = this.textboxes.insert_string.value;
        this.set_property(property, value);
  },

  append_string: function(property){
        var value = this.current_item.getProperty(property);
        if (value)
            value = value + " " + this.textboxes.append_string.value;
        else
            value = this.textboxes.append_string.value;
        this.set_property(property, value);
  },
  clear_field: function(property){
        this.set_property(property, "");
  },
  /**
   * Load the Display Pane documentation in the main browser pane
   */
  loadHelpPage: function() {
    // Ask the window containing this pane (likely the main player window)
    // to load the display pane documentation
    //top.loadURI("http://wiki.songbirdnest.com/Developer/Articles/Getting_Started/Display_Panes");
    top.loadURI("chrome://Trackman/content/welcome.xul");
  },

  _firstRunSetup : function() {
    window.gBrowser.loadOneTab("chrome://Trackman/content/welcome.xul");
  }


};

window.addEventListener("load", function(e) { Trackman.PaneController.onLoad(e); }, false);
window.addEventListener("unload", function(e) { Trackman.PaneController.onUnLoad(e); }, false);
