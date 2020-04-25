/*
c /home/kai/projects/20.03.25_Public2/node/
node start.js


*/



var Promises = {};
Promises.wait = ms => new Promise((r, j)=>setTimeout(r, ms))
Promises.resolvablePromise = () =>
{
  var resolve,reject;
  var associate = (r, j)=>{resolve = r;reject = j}
  var promise = new Promise(associate);
  promise.pending = true;
  promise.resolved = false;
  promise.rejected = false;
  promise.resolve = (r)=>
  {
    promise.pending = false;
    promise.resolved = true;
    resolve(r);
  };
  promise.reject = (e)=>
  {
    promise.pending = false;
    promise.rejected = true;
    reject(e);
  };
  return promise;
}

function wait(ms)
{
var d = new Date();
var d2 = null;
do { d2 = new Date(); }
while(d2-d < ms);
}


class WorkerPool
{
  constructor(limit=10)
  {
    this.limit = limit;
    this.workerCount = 0;
  }
  setWorker(worker)
  {
    this.worker = worker;
    return this;
  }
  async unlocked()
  {
    while(this.lock) await this.lock;
  }
  // unlocked() must be waited upon first
  async process(item)
  {
    // lock
    if(this.workerCount+1 >= this.limit)
    {
      // console.log("WorkerPool.process()","LOCKING","this.workerCount",this.workerCount);
      this.lock = Promises.resolvablePromise();
    }
    else 
      // console.log("WorkerPool.process()","NOT locking","this.workerCount",this.workerCount);
    
    this.workerCount++;
    var id = this.workerCount;
    // if(this.name) console.log(this.name,"Worker",id,"START","count",this.workerCount);
    var result;
    try
    {
      result = await this.worker(item);
    }
    catch(error)
    {
      result = {type:'error',error,item};
    }
    this.workerCount--;
    // if(this.name) console.log(this.name,"Worker",id,"DONE","count",this.workerCount);

    // unlock
    if(this.lock)
    {
      this.lock.resolve();
      this.lock = undefined;
    }

    return result;
  }

}
Promises.WorkerPool = WorkerPool;








var _ = require('lodash');
var {ServerContext,
  randHex,valueToString,Claim,Node,makeNode,stridToNode,$$,valueToHtml,makeUnique,_idToNodeIndex,
  _object,_anything,_instanceOf,_instanciable,_claimType,_typeFrom,_typeTo,_jsMethod} = require('./core.js');

const fetch = require("node-fetch");
var fs = require('fs');
const {promisify} = require('util');
var fss = {};
fss.readdir = promisify(fs.readdir);
fss.readFile = promisify(fs.readFile);
fss.writeFile = promisify(fs.writeFile);


var loadingFromDisk = fs.existsSync("./claims.jsonlist");
if(loadingFromDisk)
{
  var claimsStr = fs.readFileSync("./claims.jsonlist",{encoding:'utf8'});
  var claims = claimsStr.split('\n').map(line=>
  {
    if(line.length == 0)return;
    var claim = Claim.fromCompactJson(JSON.parse(line));
    claim.from.addClaim(claim); // might not know about multipleValues on time
    return claim;
  });
  console.log("Claims loaded from disk.","Claim count",claims.length-1);
}

// .jsonlist : 1 json object per line (in this case, one claim as .toCompactJson() per line)
var stream = fs.createWriteStream("./claims.jsonlist", {flags:'a',encoding: 'utf8'});
Claim.onNewClaim = claim=>
{
  var compactJson = claim.toCompactJson();
  stream.write(JSON.stringify(compactJson) + "\n");
}


if(!loadingFromDisk)
{

  $$('instanciable (instanciable)');
  $$('jsMethod instanciable.make');
  $$('boolean (instanciable)');
  $$('true (boolean)');
  $$('false (boolean)');



  $$('string object.strid');
  $$('instanciable object.instanceOf');

  $$('primitive (instanciable)');
  $$('string (primitive)');
  $$('number (primitive)');
  $$('jsMethod (primitive)');

  $$('person (instanciable)');
  $$('string person.title');
  var KaiElvin = $$('kaielvin').$(_instanceOf,'person').$('title',{s:'Kai Elvin'});
  Node.defaultUser = KaiElvin;

  // $$('claimType > typeFromOne > object');
  $$('instanciable claimType.typeFrom');
  $$('anything     claimType.typeTo');
  $$('boolean      claimType.multipleValues');
  $$('boolean      claimType.functional');
  $$('anything     claimType.defaultValue');
  $$('jsMethod     claimType.resolve');

  $$('string instanciable.defaultPageView');
  $$('instanciable.defaultPageView','defaultValue',{s:'simpleView'});


  $$('string object.prettyString',o=>
  {
    // var instanciable = o.getFromType_node(_instanceOf);
    // var instanciableMethod = instanciable && stridToNode(instanciable.name+'.prettyString');
    // return instanciableMethod && $$(o,instanciableMethod) || o.getFromType_string($$('person.name')) || o.name;

    var title = $$(o,'title');
    return title || o.name;
  });
  $$('string object.link',o=>'<a href="#'+o.name+'">'+$$(o,'prettyString')+'</a>');


  $$('string object.htmlSmallDescription',function()
  {
    var instanciable = this.getFromType_node(_instanceOf);
    var instanciableMethod = instanciable && stridToNode(instanciable.name+'.htmlSmallDescription');
    // console.log("object.htmlSmallDescription()","instanciableMethod",instanciable.name+'.htmlSmallDescription',instanciableMethod);
    return $$(this,instanciableMethod || 'object.link')
  });


  $$('string object.rowView',function()
  {
    return '<div class="rowView">'
        +'<div>'
          +'<div class="title">'+this.$('htmlSmallDescription')+'</div>'
          +'<div class="subtitle">'+this.$('instanceOf').$('htmlSmallDescription')+'</div>'
          +'<div class="tags">'+this.$('tags').map(tag=>tag.$('htmlSmallDescription')).join(', ')+'</div>'
        +'</div>'
      +'</div>';
  });


  $$('string object.simpleView',function()
  {
    console.log("object.simpleView()","id",this.id);

    var instanciable = this.getFromType_node(_instanceOf);

    console.log("object.simpleView()","instanciable",instanciable&&instanciable.name);


    var instanciableFromTypes = instanciable &&
      instanciable.getToType_froms($$('claimType.typeFrom'))
      || [];

    var objectFromTypes = _object.getToType_froms($$('claimType.typeFrom'));
    _.pullAll(objectFromTypes,instanciableFromTypes);

    var otherFromTypes = this.getFrom_types();
    _.pullAll(otherFromTypes,instanciableFromTypes);
    _.pullAll(otherFromTypes,objectFromTypes);

    var fromTypeToLi = type=>
      $$(makeUnique([
          [_instanceOf,"descriptorTo"],
          ['descriptorTo.from',this],
          ['descriptorTo.type',type],
        ]),'descriptorTo.htmlList');


    var instanciableToTypes = instanciable &&
      instanciable.getToType_froms($$('claimType.typeTo'))
      || [];

    var objectToTypes = _object.getToType_froms($$('claimType.typeTo'));
    _.pullAll(objectToTypes,instanciableToTypes);

    var otherToTypes = this.getTo_types();
    _.pullAll(otherToTypes,instanciableToTypes);
    _.pullAll(otherToTypes,objectToTypes);

    var toTypeToLi = type=>
      $$(makeUnique([
          [_instanceOf,"descriptorFrom"],
        ['descriptorFrom.to',this],
        ['descriptorFrom.type',type],
        ]),'descriptorFrom.htmlList');

    var elements = [];
    elements.push('<h1>'+$$(this,'prettyString')+'</h1>');

    if(instanciable)
    {
      var descriptor = makeUnique([
        [_instanceOf,"descriptorFrom"],
        ['descriptorFrom.to',this],
        ['descriptorFrom.type',_instanceOf],
      ]);

      elements.push('<div>instance of: '+$$(instanciable,'object.link')
          +(instanciable == _instanciable ? ' <span class="link" onclick="createInDescriptor($$(\''+descriptor.id+'\'))">[new]</span>' : '')
        +'</div><br/>');
    }

    elements.push((instanciableFromTypes.length > 0 || instanciableToTypes.length > 0)
      && '<div>as '+$$(instanciable,'object.link')+':</div>');
    elements.push(instanciableFromTypes.length > 0
      && '<ul>'+instanciableFromTypes.map(fromTypeToLi).join('')+'</ul>');
    elements.push(instanciableToTypes.length > 0
      && '<ul>'+instanciableToTypes.map(toTypeToLi).join('')+'</ul>');

    elements.push((objectFromTypes.length > 0 || objectToTypes.length > 0)
      && '<div>as '+$$(_object,'object.link')+':</div>');
    elements.push(objectFromTypes.length > 0
      && '<ul>'+objectFromTypes.map(fromTypeToLi).join('')+'</ul>');
    elements.push(objectToTypes.length > 0
      && '<ul>'+objectToTypes.map(toTypeToLi).join('')+'</ul>');

    elements.push((otherFromTypes.length > 0 || otherToTypes.length > 0)
      && '<div>others:</div>');
    elements.push(otherFromTypes.length > 0
      && '<ul>'+otherFromTypes.map(fromTypeToLi).join('')+'</ul>');
    elements.push(otherToTypes.length > 0
      && '<ul>'+otherToTypes.map(toTypeToLi).join('')+'</ul>');

    if(instanciable && instanciable == _instanciable)
    {
        elements.push('<h2>Instances:</h2>');
        elements.push('<div class="items-row">'+this.$froms('instanceOf').map(item=>$$(item,'rowView')).join('')+'</div>');
    }


    elements = elements.filter(_.identity);
    return '<div>'
        +elements.join('\n');
      +'</div>';
  });


  $$('object    descriptorTo.from');
  $$('claimType descriptorTo.type');
  $$('anything  descriptorTo.resolve',o=>
  {
    var type = o.getFromType_node($$('descriptorTo.type'));
    if(!type) return undefined;
    var from_ = o.getFromType_node($$('descriptorTo.from'));
    if(!from_) return undefined;
    if($$(type,'multipleValues') == $$('true'))
    {
      return from_.getFromType_nodes(type);
    }
    return from_.getFromType_to(type);
  });
  $$('string    descriptorTo.htmlList',o=>
  {
    var type = $$(o,'descriptorTo.type');
    var functional = type.getFromType_boolean($$('claimType.functional'));
    var toType = $$(type,'claimType.typeTo');
    var to = !functional && $$(o,'descriptorTo.resolve');
    to = _.isArray(to)
      ? $$('objectsToHtml','js') (to)
      : valueToHtml(to);
    return '<li>'
      +$$(type,'object.link')
      +_.escape(' > ')
      + (functional
        ? '*functional*'
        : to
          + (toType === $$("string")
            ? ' <span class="link" onclick="editStringDescriptor($$(\''+o.id+'\'))">[edit]</span>'
            : ' <span class="link" onclick="updateSelectedDescriptor($$(\''+o.id+'\'))">[select]</span>'
            )
      )
      +'</li>'
  });
  $$('string descriptorTo.prettyString',o=>
        "["  +$$($$(o,'descriptorTo.from'),'prettyString')
       +" > "+$$($$(o,'descriptorTo.type'),'prettyString')
       +"]");
  $$('string descriptorTo.htmlSmallDescription',o=>
  {
    var from = $$(o,'descriptorTo.from');
    var type = $$(o,'descriptorTo.type');
    return '<span>'
        +'Selected: ['+$$(from,'object.link')+_.escape(" > ")+$$(type,'object.link')+']'
        +'<br/><span class="link" onclick="createInDescriptor($$(\''+o.id+'\'))">[new]</span>'
      +'</span>';
  });

  $$('object    descriptorFrom.to');
  $$('claimType descriptorFrom.type');
  $$('object*   descriptorFrom.resolve',o=>
  {
    var type = $$(o,'descriptorFrom.type');
    if(!type) return [];
    var to = $$(o,'descriptorFrom.to');
    if(!to) return [];
    return to.getToType_froms(type);
  });
  $$('object    descriptorFrom.instanciate',o=>
  {
    var type = $$(o,'descriptorFrom.type');
    if(!type) return undefined;
    var to = $$(o,'descriptorFrom.to');
    if(!to) return undefined;
    var instance = new Node();
    $$(instance,type,to);
    return instance;
  });
  $$('string    descriptorFrom.htmlList',o=>
  {
    var type = $$(o,'descriptorFrom.type');
    var froms = $$(o,'descriptorFrom.resolve');

    return '<li>'
        +$$('objectsToHtml','js') (froms,12,
          $$(type,'object.link')+_.escape(' < '),
          ' <span class="link" onclick="updateSelectedDescriptor($$(\''+o.id+'\'))">[select]</span>')
      +'</li>';


    // var type = $$(o,'descriptorFrom.type');
    // var froms = $$(o,'descriptorFrom.resolve');
    // var truncated = froms.length > 12;
    // if(truncated) froms = _.slice(froms,0,12);

    // return '<li>'
    //   +$$(type,'object.link')
    //   +_.escape(' < ')
    //   +(froms.length == 0 ? 'none' : froms.map(o=>$$(o,'object.link')).join(', '))
    //   +(truncated ? ', (…)' : '')
    //   +' <span class="link" onclick="updateSelectedDescriptor($$(\''+o.id+'\'))">[select]</span>'
    //   +'</li>'
  });
  $$('string descriptorFrom.prettyString',o=>
        "["  +$$($$(o,'descriptorFrom.to'  ),'prettyString')
       +" < "+$$($$(o,'descriptorFrom.type'),'prettyString')
       +"]");
  $$('string descriptorFrom.htmlSmallDescription',o=>
  {
    var to   = $$(o,'descriptorFrom.to');
    var type = $$(o,'descriptorFrom.type');
    // var froms = $$(o,'descriptorFrom.resolve');
    // console.log("descriptorFrom.onSelect()","o.id",o.id,"froms",froms.map(o=>o.name).join(', '));
    // console.log("descriptorFrom.htmlSmallDescription()","descriptor",o,$$(to,'object.link')+_.escape(" < ")+$$(type,'object.link'));
    return '<span>'
        +'Selected: ['+$$(to,'object.link')+_.escape(" < ")+$$(type,'object.link')+']'
        +'<br/><span class="link" onclick="createInDescriptor($$(\''+o.id+'\'))">[new]</span>'
      +'</span>';
  });




  $$('object    descriptorDifference.positive');
  $$('object    descriptorDifference.negative');
  $$('object*   descriptorDifference.resolve',o=>
  {
    var positive = $$(o,'descriptorDifference.positive');
    if(!positive) return [];
    var negative = $$(o,'descriptorDifference.negative');
    if(!negative) return [];
    positive = positive.$('resolve');
    negative = negative.$('resolve');
    return _.without(positive,...negative);
  });
  $$('object    descriptorDifference.instanciate',o=>
  {
    var positive = $$(o,'descriptorDifference.positive');
    if(!positive) return undefined;
    return positive.$('instanciate');
  });
  $$('string descriptorDifference.prettyString',o=>
        "["  +o.$('positive').$('prettyString')
       +" - "+o.$('negative').$('prettyString')
       +"]");
  $$('string descriptorDifference.htmlSmallDescription',o=>
  {
    var positive = $$(o,'descriptorDifference.positive');
    var negative = $$(o,'descriptorDifference.negative');
    return '<span>'
        +'Selected: ['+$$(positive,'object.link')+_.escape(" - ")+$$(negative,'object.link')+']'
        +'<br/><span class="link" onclick="createInDescriptor($$(\''+o.id+'\'))">[new]</span>'
      +'</span>';
  });

   





  $$('jsMethod method.js');
  $$('objectsToHtml').$('instanceOf','method').$('js',(values,truncateCount=12,startItem='',endItem='')=>
  {
    var truncated = values.length > 12;
    if(truncated) values = _.slice(values,0,12);

    return ''
      +startItem
      +(values.length == 0 ? 'none' : values.map(o=>$$(o,'object.link')).join(', '))
      +(truncated ? ', (…)' : '')
      +endItem;
  });











  $$('anything listItem.value')
  $$('listItem listItem.next')
  $$('listItem listItem.prev')
  $$('listItem list.first')
  $$('listItem list.last')
  $$('list list.push',function(value)
  {
    var item = $$().$(_instanceOf,'listItem').$('listItem.value',value);
    var last = this.$('list.last');
    if(!last)
    {
      this.$('list.first',item);
      this.$('list.last',item);
    }
    else
    {
      last.$('listItem.next',item);
      item.$('listItem.prev',last);
      this.$('list.last',item);
    }
    return this;
  });








  $$('string menu.title')
  $$('object* menu.options')
  $$('menu','defaultPageView',{s:'floatingView'});
  $$('string menu.floatingView',function()
  {
    return '<div class="menu floatingView">'
        +this.$('options').map((option,i)=>'<div class="option">'+i+': '+option.$('link')+'</div>').join('')
      +'</div>';
  })
  $$('string menu.link',function()
  {
    return '<a href="#'+this.name+'">'+_.escape('> ')+this.$('prettyString')+'</a>';
  })
  $$('string menuHyperlink.title')
  $$('object menuHyperlink.linked')
  $$('claimType menuHyperlink.view')
  $$('string menuHyperlink.link',function()
  {
    var title = this.$('prettyString');
    var link = this.$('linked');
    if(link) title = '<a href="#'+link.name+'">'+title+'</a>'
    return title;
  })



  $$('kaisHome')
    .$('instanceOf','menu')
    .$('menu.title',{s:'home'})
    .$('options',

      $$()
        .$('instanceOf','menu')
        .$('menu.title',{s:'core menu'})
        .$('options',$$('kaisHome'))
        .$('options',
          $$().$('instanceOf','menuHyperlink')
            .$('title',{s:'show tag'})
            .$('linked','tag')
        )
        .$('options',
          $$().$('instanceOf','menuHyperlink')
            .$('title',{s:'show instanciable'})
            .$('linked','instanciable')
        )

    )
    .$('options',
      $$().$('instanceOf','menuHyperlink')
        .$('title',{s:'watch educative video'})
        .$('linked',$$('KaiWatchingList'))
    )














  // async function fetchYoutubePlaylistPages(playlistId,pages=[],pageToken=undefined)
  // {
  //   var url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=AIzaSyAL23rZogdOZasdGcPD92_7Gxy4hkvMlZE&playlistId='+playlistId+'&maxResults=50';
  //   if(pageToken) url+= '&pageToken='+pageToken;
  //   console.log("fetchYoutubePlaylistPages()",'fetching',url);
  //   var fetched = await fetch(url);
  //   var json = await fetched.json();
  //   pages.push(json);
  //   if(json.nextPageToken) await fetchYoutubePlaylist(playlistId,pages,json.nextPageToken);
  //   return pages;
  // }
  // // TODO expire cache past a certain date
  // async function getYoutubePlaylistPages(playlistId)
  // {
  //   var cachePath = './cache/youtube_playlist/'+playlistId+'.json';
  //   if(fs.existsSync(cachePath)) return JSON.parse(await fss.readFile(cachePath));
  //   var cached = {};
  //   cached.pages = await fetchYoutubePlaylistPages(playlistId);
  //   cached.requestedAt = new Date();
  //   await fss.writeFile(cachePath,JSON.stringify(cached),'utf8');
  //   return cached;
  // }

  // // makeYouTubeVideoFromPlaylistDataAndByFetching = async item=>
  // // {
  // //   var video = await $$('YoutubeVideo','instanciable.make')(item.snippet.resourceId.videoId,false);

  // //   $$('YoutubeThumbnailResolution').$froms('instanceOf').forEach(resolution=>
  // //   {
  // //     // console.log("resolution",resolution.name,$$(resolution,'stringName'));
  // //     if(item.snippet.thumbnails[$$(resolution,'stringName')])
  // //       video.$('thumbnailResolutions',resolution);
  // //   });
  // //   return video;
  // // }

  // // var makeYouTubeVideoFromPlaylistDataAndByFetching_Pool = new Promises.WorkerPool(25)
  // //   .setWorker(makeYouTubeVideoFromPlaylistDataAndByFetching);



  // // ServerContext.cachedFetch_YoutubePlaylistVideos = async pid=>
  // // {
  // //   var videos = [];
  // //   var json = await getYoutubePlaylistPages(pid);
  // //   if(!json.pages) return [];

  // //   var videosPromises = [];
  // //   for(var p in json.pages)
  // //     for(var i in json.pages[p].items)
  // //     {
  // //       var item = json.pages[p].items[i];
  // //       await makeYouTubeVideoFromPlaylistDataAndByFetching_Pool.unlocked();
  // //       videosPromises.push(makeYouTubeVideoFromPlaylistDataAndByFetching_Pool.process(item));

  // //       // console.log("cachedFetch_YoutubePlaylistVideos() DONE ",video.$('title'));

  // //       // var video = await $$('YoutubeVideo','instanciable.make')(item.snippet.resourceId.videoId,true);
  // //       // video.$('title',{s:item.snippet.title});
  // //       // video.$('description',{s:item.snippet.description});

  // //       // var video = await $$('YoutubeVideo','instanciable.make')(item.snippet.resourceId.videoId,false);

  // //       // $$('YoutubeThumbnailResolution').$froms('instanceOf').forEach(resolution=>
  // //       // {
  // //       //   console.log("resolution",resolution.name,$$(resolution,'stringName'));
  // //       //   if(item.snippet.thumbnails[$$(resolution,'stringName')])
  // //       //     video.$('thumbnailResolutions',resolution);
  // //       // });
  // //       // videos.push(video);
  // //     }
      
  // //   var videos = Promise.all(videosPromises);
  // //   return videos;
  // // }




  // ServerContext.cachedFetch_YoutubeVideo = async vid=>
  // {
  //   var cachePath = './cache/youtube_video/'+vid+'.json';
  //   if(fs.existsSync(cachePath)) return JSON.parse(await fss.readFile(cachePath));
  //   var url = 'https://www.googleapis.com/youtube/v3/videos?id='+vid+'&key=AIzaSyAL23rZogdOZasdGcPD92_7Gxy4hkvMlZE&part=snippet,contentDetails,statistics,status';
  //   console.log("ServerContext.cachedFetch_YoutubeVideo()",'fetching',url);
  //   var fetched = await fetch(url);
  //   var json = await fetched.json();
  //   if(json.error) return undefined;
  //   json.requestedAt = new Date();
  //   await fss.writeFile(cachePath,JSON.stringify(json),'utf8');
  //   return json;
  // }



  // // $$('string YoutubePlaylist.title');
  // // $$('string YoutubePlaylist.prettyString',o=>$$(o,"title")||o.id);
  // // $$('string YoutubeVideo.defaultView',o=>"page");
  // // $$('string YoutubeVideo.page',async o=>

  // // });


















































  async function YouTubeHtmlFetch(cacheFolderName,url,id,jsonVariable)
  {
    var cachePath = './cache/'+cacheFolderName+'/'+id+'.json';
    if(fs.existsSync(cachePath)) return JSON.parse(await fss.readFile(cachePath));

    console.log("YouTubeHtmlFetch()",'url',url,'…');
    var path = 'https://cors-anywhere.herokuapp.com/'+url;
    // var path = url;

    var fetched = await fetch(path,{headers:{
        "X-Requested-With":"Chrome",
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.113 Safari/537.36",
      }});

    var text = await fetched.text();
    var startStr = 'window["'+jsonVariable+'"] = ';
    var start = text.indexOf(startStr);
    if(start == -1) throw new Error('no json information found, path='+path+', returned: '+text);
    start+= startStr.length;
    var stop = text.indexOf(";\n",start);
    if(stop == -1) throw new Error('no json information found, path='+path+', returned: '+text);

    // var match = text.match(/window\[\"ytInitialPlayerResponse\"\] = (.*)/);
    // if(!match) await fss.writeFile(cachePath+'.error.html',text,'utf8');
    // if(!match) throw new Error('no json information found, path='+path+', returned: '+text);

    var json = text.substring(start,stop);
    json = JSON.parse(json);


    // console.log('FOUND',json);
    // console.log('FOUND',JSON.stringify(json,null,'    '));

    var result = {};
    result.fetchDate = new Date();
    result.sourceHtml = text;
    result.extractedJson = json;

    await fss.writeFile(cachePath,JSON.stringify(result),'utf8');
    return result;
  }
  ServerContext.cachedFetch_YoutubeVideo2 = async vid=>
  {
    return await YouTubeHtmlFetch('youtube_video_fromHtml','https://www.youtube.com/watch?v='+vid,vid,'ytInitialPlayerResponse');
  }
  ServerContext.cachedFetch_YoutubePlaylist2 = async pid=>
  {
    return await YouTubeHtmlFetch('youtube_playlist_fromHtml','https://www.youtube.com/playlist?list='+pid,pid,'ytInitialData');
  }



  $$('YoutubeVideo','instanciable.make',async (vid,skipFetch=false)=>
  {
    var o = stridToNode(vid);
    if(o) return o;

    var processedJson = {};
    // if(!skipFetch && !o.$('title'))
    if(!skipFetch)
    {
      var {extractedJson} = await ServerContext.cachedFetch_YoutubeVideo2(vid);

      var videoDetails = extractedJson.videoDetails;
      var microformat = extractedJson.microformat;
      // if(!videoDetails) console.error(JSON.stringify(extractedJson,null,'    '));
      if(!videoDetails) throw new Error("videoDetails is undefined for: https://www.youtube.com/watch?v="+vid);
      if(!microformat) throw new Error("microformat is undefined for: https://www.youtube.com/watch?v="+vid);
      var playerMicroformatRenderer = microformat.playerMicroformatRenderer;
      if(!playerMicroformatRenderer) throw new Error("playerMicroformatRenderer is undefined for: https://www.youtube.com/watch?v="+vid);

      processedJson.title = videoDetails.title;
      processedJson.lengthSeconds = Number(videoDetails.lengthSeconds);
      processedJson.averageRating = videoDetails.averageRating;
      processedJson.viewCount = Number(videoDetails.viewCount);
      processedJson.publishDate = new Date(playerMicroformatRenderer.publishDate);
      processedJson.uploadDate = new Date(playerMicroformatRenderer.uploadDate);
      processedJson.description = playerMicroformatRenderer.description.simpleText;
      processedJson.keywords = videoDetails.keywords;
      processedJson.channelId = videoDetails.channelId;
      processedJson.author = videoDetails.author;
      processedJson.ownerChannelName = playerMicroformatRenderer.ownerChannelName;

      var maxThumbnailResolution = _.last(playerMicroformatRenderer.thumbnail.thumbnails).url.match(/\/([^\.\/]+)\.[a-z0-9]+$/i);
      if(maxThumbnailResolution)
        processedJson.maxThumbnailResolution = maxThumbnailResolution[1];

      if(!o) o = makeNode(vid).$(_instanceOf,'YoutubeVideo');

      // console.log("processedJson",JSON.stringify(processedJson,null,'   '))
      // if(processedJson.maxThumbnailResolution != 'maxresdefault') console.log("processedJson",JSON.stringify(processedJson,null,'   '))
      o.$('title',{s:processedJson.title});
      o.$('description',{s:processedJson.description});
      o.$('length',{n:processedJson.lengthSeconds});
      o.$('viewCount',{n:processedJson.viewCount});
      var channel = ServerContext.makeYoutubeChannel(processedJson.channelId,processedJson.ownerChannelName);
      o.$('channel',channel);
      
      console.log(_.padEnd(channel.$('title'),50),o.$('title'));

      var maxThumbnailResolution = processedJson.maxThumbnailResolution
        && $$('YoutubeThumbnailResolution').$froms('instanceOf')
          .find(resolution=>
            resolution.$('urlCode') == processedJson.maxThumbnailResolution );

      if(!maxThumbnailResolution) maxThumbnailResolution =
        $$('YoutubeThumbnailResolution').$froms('instanceOf')
          .find(resolution=>
            resolution.$('urlCode') == 'default' );

      o.$('thumbnailResolutions',maxThumbnailResolution);
    }
    // if(!skipFetch && !o.$('title'))
    // {
    //   var snippet = await ServerContext.cachedFetch_YoutubeVideo(o.name);
    //   // console.log("YoutubeVideo.page",'snippet',JSON.stringify(snippet,null,'   '));
    //   snippet = snippet && snippet.items;
    //   snippet = snippet && snippet[0];
    //   snippet = snippet && snippet.snippet;
    //   // console.log("YoutubeVideo.title",snippet.title);
    //   if(snippet && snippet.title) o.$('title',{s:snippet.title});

    //   $$('YoutubeThumbnailResolution').$froms('instanceOf').forEach(resolution=>
    //   {
    //     if(snippet.thumbnails[$$(resolution,'stringName')])
    //       o.$('thumbnailResolutions',resolution);
    //   });
    // }

    return o;
  });


  var makeYouTubeVideoFromPlaylistDataAndByFetching_Pool = new Promises.WorkerPool(25)
    .setWorker(async vid=> await $$('YoutubeVideo','instanciable.make')(vid) );

  ServerContext.cachedFetch_YoutubePlaylistVideos = async pid=>
  {
    var {extractedJson} = await ServerContext.cachedFetch_YoutubePlaylist2(pid);
    // yeah, that's one long dive:
    var vids = extractedJson.contents
      .twoColumnBrowseResultsRenderer
      .tabs[0].tabRenderer.content
      .sectionListRenderer.contents[0]
      .itemSectionRenderer.contents[0]
      .playlistVideoListRenderer.contents
      .map(obj=>obj.playlistVideoRenderer.videoId);

    var videosPromises = [];
    for(var vid of vids)
    {
        await makeYouTubeVideoFromPlaylistDataAndByFetching_Pool.unlocked();
        videosPromises.push(makeYouTubeVideoFromPlaylistDataAndByFetching_Pool.process(vid));
    }
    var videos = await Promise.all(videosPromises);
    // console.log("cachedFetch_YoutubePlaylistVideos()","videos.length",videos.length);
    videos = videos.filter(video=>
    {
      if(!video.error) return true;
      console.error("Failed loading video "+video.item,video.error);
      return false;
    })
    // console.log("cachedFetch_YoutubePlaylistVideos()","videos.length",videos.length,'.');
    return videos;
  }



  $$('string YoutubeChannel.title');
  ServerContext.makeYoutubeChannel = (cid,title)=>
  {
    var channel = stridToNode(cid);
    if(channel) return channel;
    channel = $$(cid).$('instanceOf','YoutubeChannel').$('title',{s:title});
    return channel;
  }

  $$('string YoutubeVideo.title');
  $$('string YoutubeVideo.description');
  $$('number YoutubeVideo.length');
  $$('number YoutubeVideo.viewCount');
  $$('YoutubeChannel YoutubeVideo.channel');
  $$('string YoutubeVideo.prettyString',o=>$$(o,"title")||$$(o,"strid"));
  $$('YoutubeThumbnailResolution* YoutubeVideo.thumbnailResolutions');
  $$('string YoutubeVideo.page',function()
  {
    // if(!$$(o,'YoutubeVideo.title'))
    // {
    //   var snippet = await ServerContext.cachedFetch_YoutubeVideo(o.name);
    //   console.log("YoutubeVideo.page",'snippet',JSON.stringify(snippet,null,'   '));
    //   snippet = snippet && snippet.items;
    //   snippet = snippet && snippet[0];
    //   snippet = snippet && snippet.snippet;
    //   console.log("YoutubeVideo.title",snippet.title);
    //   if(snippet && snippet.title) o.$('title',{s:snippet.title});
    // }
    return '<div>'
        +'<h1>'+$$(this,'prettyString')+'</h1>'
        +'<iframe width="1000" height="600" src="https://www.youtube.com/embed/'+this.name+'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      +'</div>';
  });
  $$('string YoutubeVideo.boxView',function()
  {
    var resolutions = _.sortBy( $$(this,'thumbnailResolutions'), resolution=>-$$(resolution,'width') );
    return '<div class="youtube-box">'
        +'<img src="https://i.ytimg.com/vi/'+this.name+'/'+$$(resolutions[0],'urlCode')+'.jpg" width="1280" height="720" />'
        // +'<div class="img-div"></div>'
        +'<div>'+$$(this,'prettyString')+'</div>'
      +'</div>';
  });
  $$('string YoutubeVideo.rowView',function()
  {
    var resolutions = _.sortBy( $$(this,'thumbnailResolutions'), resolution=>-$$(resolution,'width') );

    var zzNum = num => num < 10 ? '0'+num : ''+num;
    var lengthSeconds = this.$('length');
    var lengthHours = Math.floor(lengthSeconds/60/60);
    lengthSeconds-= lengthHours*60*60;
    var lengthMinutes = Math.floor(lengthSeconds/60);
    lengthSeconds-= lengthMinutes*60;
    var duration = (lengthHours?lengthHours+':':'')+zzNum(lengthMinutes)+':'+zzNum(lengthSeconds);

    return '<div class="rowView youtube">'
        +'<a href="https://www.youtube.com/watch?v='+this.name+'"><img src="https://i.ytimg.com/vi/'+this.name+'/'+$$(resolutions[0],'urlCode')+'.jpg" /></a>'
        // +'<div class="img-div"></div>'
        +'<div>'
          +'<div class="title">'+this.$('link')+'</div>'
          +'<div class="subtitle">'+this.$('channel').$('link')+'</div>'
          +'<div class="subtitle">'+duration+' - '+this.$('viewCount')+' views</div>'
          +'<div class="tags">'+this.$('tags').map(tag=>tag.$('link')).join(', ')+'</div>'
        +'</div>'
      +'</div>';
  });




  $$('string tag.title');
  $$('person tag.createdBy');
  $$('tag* object.tags');


  $$('KaiWatchingList (tag)')
    .$('title',{s:'Kai\'s watching list'})
    .$('createdBy','kaielvin');

  [
    'psychology',
    'morality',
    'existence',
    'self-improvement',
    'consciousness',
    'society',
    'neuroscience',
    'philosophy-of-mind',
    'social',
    'technology',
    'hegel',
    'art&design',
    'to-rewatch',
  ]
  .forEach(tagName=>
    $$()
    .$('instanceOf','tag')
    .$('title',{s:tagName})
    .$('createdBy','kaielvin')
  );

  $$('tag','defaultPageView',{s:"page"});
  $$('string tag.page',function()
  {
    var items = this.$froms('object.tags');
    return '<div class="items-row">'+items.map(item=>$$(item,'rowView')).join('')+'</div>';
  });

  // $$('string        playlist.title');
  // $$('YoutubeVideo* playlist.items');
  // $$('KaiWatchingList (playlist)');





  $$('object collection.descriptor');
  $$('collection','defaultPageView',{s:'page'});
  $$('string collection.page', function()
  {
    var descriptor = this.$('descriptor');
    var objects = descriptor.$('resolve');

    console.log("collection.page()",objects);
    console.log("collection.page()",descriptor.$('prettyString'));

    var tags = {};
    objects.forEach(object=>  object.$('tags').forEach(tag=> tags[tag.id] = (tags[tag.id]||0)+1)  );
    tags = _.keys(tags).map(tagId=> ({tag:$$(tagId),count:tags[tagId]}) );
    tags = _.sortBy(tags,({count})=>-count).map(({tag})=>tag);

    console.log("collection.page()",objects.length);
    return '<div class="collection">'
        +'<div class="descriptor">'+descriptor.$('prettyString')+'</div>'
        +'<div class="tags">'+tags.map(tag=>tag.$('link')).join(', ')+'</div>'
        +'<div class="items-row">'
          +objects.map((option,i)=>option.$('rowView')).join('')
        +'</div>'
      +'</div>';
  });

  $$('collectionTest (collection)')
    .$('descriptor',
      
      $$()
        .$('instanceOf','descriptorDifference')
        .$('positive',
          $$()
            .$('instanceOf','descriptorFrom')
            .$('to','KaiWatchingList')
            .$('type','object.tags')
        )
        .$('negative',
          $$()
            .$('instanceOf','descriptorFrom')
            .$('to',  KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'self-improvement')  )
            .$('type','object.tags')
        )
    );













  (async ()=>
  {

    await wait(500);
    console.log("MAKING");
    // $$('YoutubeVideo','instanciable.make')('Lhv_yFMuwxs');
    // $$('YoutubeVideo','instanciable.make')('nnVq6gmatHU');
    // $$('YoutubeVideo','instanciable.make')('Qw4l1w0rkjs');
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQs9dl3butrQDN0mqZJyG95'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'existence')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQSeOwjFgky9RRBGWpY-5xNh'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'morality')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQTBfsRCrrr6vGOjFDQSgRpJ'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'self-improvement')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQL8Z07uB8XUSeSkeW_EG66'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'consciousness')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQS14MaRPjRdYM_Y-HwoQFPJ'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'psychology')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQuJC8vK0iDB_Gsrbldwj_A'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'society')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQ6TV2go-XCcB4n3s7bWj6q'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'neuroscience')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQy4UXMPHp9tw7OUidxiKeB'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'philosophy-of-mind')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQVeEl1C6SuYtIUE-caAqG0'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'social')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQRLIQuriccuibNULk_RNvSu'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'technology')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQQbNvrSfhcS9L1h9sjj-k4Q'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'hegel')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQS9Rq-ZWd00czLSWdbhjfr6'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'art&design')) );
    (await ServerContext.cachedFetch_YoutubePlaylistVideos('PLfoEg9YVcQQRPDlWPVHjc-ALoZvzjeH3s'))
      .forEach(video=> video.$('tags',KaiElvin.$froms('tag.createdBy').find(u=>u.$('title') == 'to-rewatch')) );

    await wait(50);
    console.log("filling KaiWatchingList");

    $$('YoutubeVideo').$froms('instanceOf').forEach(video=>
      $$(video,'tags','KaiWatchingList') );

    // $$('YoutubeVideo').$from('instanceOf').forEach(video=>
    //   $$('KaiWatchingList').$('items',video) );

  })()










  // https://www.youtube.com/oembed?format=json&amp;url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DnnVq6gmatHU
  // https://www.googleapis.com/youtube/v3/videos?id=nnVq6gmatHU&key=AIzaSyByA7cXJD_3Hi8f2rTQ3loCyqIA6NfK9fc&part=snippet,contentDetails,statistics,status
  //https://www.youtube.com/embed/HIbAz29L-FA?modestbranding=1&playsinline=0&showinfo=0&enablejsapi=1&origin=https%3A%2F%2Fintercoin.org&widgetid=1
  // var url = new URL('https://www.youtube.com/watch?v=PZozMO3wWf&l=01234567');
  // console.log(url,url.searchParams.keys(),url.searchParams.get('v'));
  // for (let p of url.searchParams) {
  //   console.log(p);
  // }




  $$('string YoutubeThumbnailResolution.stringName');
  $$('number YoutubeThumbnailResolution.width');
  $$('number YoutubeThumbnailResolution.height');
  $$('string YoutubeThumbnailResolution.urlCode');
  $$('string YoutubeThumbnailResolution.prettyString',o=>o.$('stringName'));
  // $$('YoutubeThumbnailResolutions (list)');

  [
    ['default' , 120, 90, 'default'],
    ['medium'  , 320,180, 'mqdefault'],
    ['high'    , 480,360, 'hqdefault'],
    ['standard', 640,480, 'sddefault'],
    ['maxres'  ,1280,720, 'maxresdefault'],
  ]
  .forEach(([name,width,height,urlCode])=>
  {
    var item = $$()
      .$(_instanceOf,"YoutubeThumbnailResolution")
      .$('stringName',{s:name})
      .$('width',{n:width})
      .$('height',{n:height})
      .$('urlCode',{s:urlCode});
    // $$('YoutubeThumbnailResolutions').$ex('push',item);
  });
}















































const express = require('express')
const app = express()
const port = 3000
var bodyParser = require('body-parser');
app.use( bodyParser.json({limit: '50mb'}) );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var cors = require('cors')
app.use(cors())


function nodeToJson(node,includeFroms=false)
{
  var id = node.id;

  // _.mapValues(node.typeTos,(claim,key)=>
  //   {
  //     if(key == 'set' || claim.to && claim.claimer) return;
  //     console.log("to undefined",claim);
  //     console.log("to undefined",claim.from);
  //     console.log("to undefined",claim.type);
  //     throw "stop";
  //   });


  var claims = _.mapValues(node.typeTos,tos=>
  {
    if(!(tos instanceof Claim))
      return ({set:_.mapValues(tos,({claimer,date})=>({claimer:claimer.id,date}))});

    var {to,claimer,date} = tos;
    to =  to instanceof Node   ? to.id
        : to.j                 ? {j:String(to.j)}
        // : to.s                 ? to
        // : to.n                 ? to
        :                        to;
    return {to,claimer:claimer.id,date};
  });

  // var claims = _.mapValues(node.typeTos,({to,claimer,date})=>
  //     to instanceof Node   ? {to:  to.id            ,claimer:claimer.id,date}
  //   : to.j                 ? {to:  {j:String(to.j)} ,claimer:claimer.id,date}
  //   : to.s                 ? {to:  to               ,claimer:claimer.id,date}
  //   : to.n                 ? {to:  to               ,claimer:claimer.id,date}
  //   :                        ({set:_.mapValues(to,({claimer,date})=>({claimer:claimer.id,date}))}) );
  var json = {id,claims};
  // if(includeFroms) json.fromClaims = _.mapValues(node.typeFroms,from_=>from_.id);
  if(includeFroms) json.fromClaims = _.mapValues(node.typeFroms,({from,claimer,date})=>
    ({from:from.id,claimer:claimer.id,date}) );
  return json;
}

app.get('/all', (req, res) =>
{
  var claimJsons = [];
  var lastClaimJsons = {};
  for(var fromId in _idToNodeIndex)
  {
    var node = _idToNodeIndex[fromId];
    for(var typeId in node.typeTos)
    {
      var claims = node.typeTos[typeId];
      for(var claim of claims)
      {
        var claimJson = claim.toCompactJson();
        
        if(claimJson.f == lastClaimJsons.f) delete claimJson.f;
        else lastClaimJsons.f = claimJson.f;
        if(claimJson.T == lastClaimJsons.T) delete claimJson.T;
        else lastClaimJsons.T = claimJson.T;
        if(_.isEqual(claimJson.t,lastClaimJsons.t)) delete claimJson.t;
        else lastClaimJsons.t = claimJson.t;
        if(claimJson.c == lastClaimJsons.c) delete claimJson.c;
        else lastClaimJsons.c = claimJson.c;
        if(claimJson.d == lastClaimJsons.d) delete claimJson.d;
        else lastClaimJsons.d = claimJson.d;

        claimJsons.push(claimJson);
      }
    }
  }
  res.send({claims:claimJsons});

  // res.send({nodes:_.values(_idToNodeIndex).map(node=>nodeToJson(node))});
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
console.log("http://localhost:3000/all");




// (async ()=>
// {
//   await wait(300);

//   $$()
//     .$(_instanceOf,'list')
//     .$ex('push',{n:42})
//     .$ex('push',{n:11});

// })()




const WebSocket = require('ws');
 
const wss = new WebSocket.Server({ port: 8080 });
 
wss.on('connection', function connection(ws)
{
  ws.on('message', async function incoming(message)
  {
    var json = JSON.parse(message);
    var response = {requestId:json.requestId,data:[]};
    console.log("on client message",json);
// {descriptor:[["instanceOf","YoutubeVideo"],["strid",vid]]}
    if(json.request == "makeYouTubeVideo")
    {
      var video = await $$('YoutubeVideo','instanciable.make')(json.vid);
      response.data.push(nodeToJson(video,true));
      response.videoId = video.id;
    }

    ws.send(JSON.stringify(response));
  });

});