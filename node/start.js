var _ = require('lodash');
var {htmlToElement,randHex,valueToString,Node,makeNode,stridToNode,$$,valueToHtml,makeUnique,_idToNodeIndex,
  _object,_anything,_instanceOf,_instanciable,_claimType,_typeFrom,_typeTo,_jsMethod} = require('./core.js');





$$('instanciable (instanciable)');
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
$$('string person.name');
var KaiElvin = $$().$(_instanceOf,'person').$('person.name',{s:'Kai Elvin'});

// $$('claimType > typeFromOne > object');
$$('instanciable claimType.typeFrom');
$$('anything     claimType.typeTo');
$$('boolean      claimType.multipleValues');
$$('boolean      claimType.functional');
$$('jsMethod     claimType.resolve');

$$('string object.prettyString',o=>
{
  var instanciable = o.getFromType_node(_instanceOf);
  var instanciableMethod = instanciable && stridToNode(instanciable.name+'.prettyString');
  return instanciableMethod && $$(o,instanciableMethod) || o.getFromType_string($$('person.name')) || o.name;
});
$$('string object.link',o=>'<a href="#'+o.name+'/'+$$(o,'defaultView')+'">'+$$(o,'object.prettyString')+'</a>');
$$('string object.defaultView',o=>"simpleView");
;

$$('string object.htmlSmallDescription',o=>
{
  var instanciable = o.getFromType_node(_instanceOf);
  var instanciableMethod = instanciable && stridToNode(instanciable.name+'.htmlSmallDescription');
  console.log("object.htmlSmallDescription()","instanciableMethod",instanciable.name+'.htmlSmallDescription',instanciableMethod);
  return $$(o,instanciableMethod || 'object.link')
});

$$('string object.simpleView',o=>
{
  console.log("object.simpleView()","id",o.id);

  var instanciable = o.getFromType_node(_instanceOf);

  var instanciableFromTypes = instanciable &&
    instanciable.getToType_froms($$('claimType.typeFrom'))
    || [];

  var objectFromTypes = _object.getToType_froms($$('claimType.typeFrom'));
  _.pullAll(objectFromTypes,instanciableFromTypes);

  var otherFromTypes = o.getFrom_types();
  _.pullAll(otherFromTypes,instanciableFromTypes);
  _.pullAll(otherFromTypes,objectFromTypes);

  var fromTypeToLi = type=>
    $$(makeUnique([
        [_instanceOf,"descriptorTo"],
        ['descriptorTo.from',o],
        ['descriptorTo.type',type],
      ]),'descriptorTo.htmlList');


  var instanciableToTypes = instanciable &&
    instanciable.getToType_froms($$('claimType.typeTo'))
    || [];

  var objectToTypes = _object.getToType_froms($$('claimType.typeTo'));
  _.pullAll(objectToTypes,instanciableToTypes);

  var otherToTypes = o.getTo_types();
  _.pullAll(otherToTypes,instanciableToTypes);
  _.pullAll(otherToTypes,objectToTypes);

  var toTypeToLi = type=>
    $$(makeUnique([
        [_instanceOf,"descriptorFrom"],
      ['descriptorFrom.to',o],
      ['descriptorFrom.type',type],
      ]),'descriptorFrom.htmlList');

  var elements = [];
  elements.push('<h1>'+$$(o,'object.prettyString')+'</h1>');

  if(instanciable)
  {
    var descriptor = makeUnique([
      [_instanceOf,"descriptorFrom"],
      ['descriptorFrom.to',o],
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
  var from = o.getFromType_node($$('descriptorTo.from'));
  if(!from) return undefined;
  return from.getFromType_to(type);
});
$$('string    descriptorTo.htmlList',o=>
{
  var type = $$(o,'descriptorTo.type');
  var functional = type.getFromType_boolean($$('claimType.functional'));
  var toType = $$(type,'claimType.typeTo');
  var to = !functional && $$(o,'descriptorTo.resolve');
  return '<li>'
    +$$(type,'object.link')
    +_.escape(' > ')
    + (functional
      ? '*functional*'
      : valueToHtml(to)
        + (toType === $$("string")
          ? ' <span class="link" onclick="editStringDescriptor($$(\''+o.id+'\'))">[edit]</span>'
          : ' <span class="link" onclick="updateSelectedDescriptor($$(\''+o.id+'\'))">[select]</span>'
          )
    )
    +'</li>'
});
$$('string descriptorTo.prettyString',o=>
      "["  +$$($$(o,'descriptorTo.from'),'object.prettyString')
     +" > "+$$($$(o,'descriptorTo.type'),'object.prettyString')
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
  var truncated = froms.length > 12;
  if(truncated) froms = _.slice(froms,0,12);

  return '<li>'
    +$$(type,'object.link')
    +_.escape(' < ')
    +(froms.length == 0 ? 'none' : froms.map(o=>$$(o,'object.link')).join(', '))
    +(truncated ? ', (…)' : '')
    +' <span class="link" onclick="updateSelectedDescriptor($$(\''+o.id+'\'))">[select]</span>'
    +'</li>'
});
$$('string descriptorFrom.prettyString',o=>
      "["  +$$($$(o,'descriptorFrom.to'  ),'object.prettyString')
     +" < "+$$($$(o,'descriptorFrom.type'),'object.prettyString')
     +"]");
$$('string descriptorFrom.htmlSmallDescription',o=>
{
  var to   = $$(o,'descriptorFrom.to');
  var type = $$(o,'descriptorFrom.type');
  // var froms = $$(o,'descriptorFrom.resolve');
  // console.log("descriptorFrom.onSelect()","o.id",o.id,"froms",froms.map(o=>o.name).join(', '));
  console.log("descriptorFrom.htmlSmallDescription()","descriptor",o,$$(to,'object.link')+_.escape(" < ")+$$(type,'object.link'));
  return '<span>'
      +'Selected: ['+$$(to,'object.link')+_.escape(" < ")+$$(type,'object.link')+']'
      +'<br/><span class="link" onclick="createInDescriptor($$(\''+o.id+'\'))">[new]</span>'
    +'</span>';
});



$$('');














$$('YoutubeVideo (instanciable)');
$$('string YoutubeVideo.title');
$$('yLuOzNeHw5I').$(_instanceOf,"YoutubeVideo");


$$('string YoutubeVideo.defaultView',o=>"page");
$$('string YoutubeVideo.page',async o=>
{
  if(!$$(o,'YoutubeVideo.title'))
  {
    var fetched = await fetch('https://www.googleapis.com/youtube/v3/videos?id='+o.name+'&key=AIzaSyByA7cXJD_3Hi8f2rTQ3loCyqIA6NfK9fc&part=snippet,contentDetails,statistics,status');
    var snippet = await fetched.json();
    snippet = snippet && snippet.items;
    snippet = snippet && snippet[0];
    snippet = snippet && snippet.snippet;
    if(snippet && snippet.title) o.$('title',{s:snippet.title});

    // var fetched2 = await fetch('https://www.googleapis.com/youtube/v3/playlists?part=id%2Csnippet&channelId=UCDDe2Yh15Yj4ljU_2f311mQ');
    // var snippet2 = await fetched2.json();
    // console.log(snippet2);
  }
  return '<div>'
      +'<h1>'+($$(o,'title')||o.name)+'</h1>'
      +'<iframe width="1000" height="600" src="https://www.youtube.com/embed/'+o.name+'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    +'</div>';
});


// https://www.youtube.com/oembed?format=json&amp;url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DnnVq6gmatHU
// https://www.googleapis.com/youtube/v3/videos?id=nnVq6gmatHU&key=AIzaSyByA7cXJD_3Hi8f2rTQ3loCyqIA6NfK9fc&part=snippet,contentDetails,statistics,status
//https://www.youtube.com/embed/HIbAz29L-FA?modestbranding=1&playsinline=0&showinfo=0&enablejsapi=1&origin=https%3A%2F%2Fintercoin.org&widgetid=1
// var url = new URL('https://www.youtube.com/watch?v=PZozMO3wWf&l=01234567');
// console.log(url,url.searchParams.keys(),url.searchParams.get('v'));
// for (let p of url.searchParams) {
//   console.log(p);
// }





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


app.get('/all', (req, res) =>
{
  res.send({nodes:_.values(_idToNodeIndex).map(node=>
  {
    var id = node.id;
    var claims = _.mapValues(node.typeTos,to=> to instanceof Node ? to.id : to.j ? {j:String(to.j)} : to );
    return {id,claims};
  })});
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
console.log("http://localhost:3000/all");