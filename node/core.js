var _ = _ || require('lodash'); // already defined on the frontend version
var MiniSearch = MiniSearch || require('minisearch'); // already defined on the frontend version

// used by JS methods in the graph to access server specific values and functions
var ServerContext = {};

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */

var randHex = function(len=8) {
  var maxlen = 8,
      min = Math.pow(16,Math.min(len,maxlen)-1) 
      max = Math.pow(16,Math.min(len,maxlen)) - 1,
      n   = Math.floor( Math.random() * (max-min+1) ) + min,
      r   = n.toString(16);
  while ( r.length < len ) {
     r = r + randHex( len - maxlen );
  }
  return r;
};

var valueToString = value=>
       !value                 ? 'undefined'
      : value instanceof Node ? value.name
      : value.s               ? 's_'+value.s
      // : value.b               ? 'b_'+value.b
      : value.n               ? 'n_'+value.n
      :                         'j_';
      // : value.j               ? 'j_'
      // :                         'b_'+value.b;



var fulltextSearch = new MiniSearch({
  fields: ['strid', 'title', 'instanciable', 'description'], // fields to index for full-text search
  storeFields: ['id'], // fields to return with search results
  searchOptions: {
    boost: { strid: 10, title: 8, instanciable: 2, description: 1 },
    prefix: true,
    fuzzy: 0.2,
  }
});
fulltextSearch.documentById = {};

var nodeTofullTextDocument = node=>
{
  var instanciable = node.$('instanceOf');
  var doc = {id:node.id};
  doc.strid = node.$('strid');
  doc.title = node.$('title');
  doc.instanciable = instanciable && instanciable.$('strid');
  doc.description = node.$('description');
  if(doc.strid && !_.isString(doc.strid))
  {
    console.error("nodeTofullTextDocument()doc.strid && !_.isString(doc.strid)",JSON.stringify(doc.strid));
    return null;
  }
  if(doc.title && !_.isString(doc.title))
  {
    console.error("nodeTofullTextDocument()doc.title && !_.isString(doc.title)",JSON.stringify(doc.title));
    return null;
  }
  if(doc.instanciable && !_.isString(doc.instanciable))
  {
    console.error("nodeTofullTextDocument()doc.instanciable && !_.isString(doc.instanciable)",JSON.stringify(doc.instanciable));
    return null;
  }
  if(doc.description && !_.isString(doc.description))
  {
    console.error("nodeTofullTextDocument()doc.description && !_.isString(doc.description)",JSON.stringify(doc.description));
    return null;
  }
  return doc;
}
var nodesToFullTextIndex = {};
var willUpdateFullTextIndexForNode = node=>
{
  var id = node.id;

  if(!nodesToFullTextIndex[id])
  nodesToFullTextIndex[id] = _.debounce(()=>
  {
    if(fulltextSearch.documentById[id])
      fulltextSearch.remove(fulltextSearch.documentById[id]);
    var doc = fulltextSearch.documentById[id] = nodeTofullTextDocument(node);
    if(doc) fulltextSearch.add(doc);
    // console.log("FULLTEXT",JSON.stringify(doc));
    delete nodesToFullTextIndex[id];
  }
  ,500);

  nodesToFullTextIndex[id]();
}


class Claim
{
  constructor(from_,type,to,claimer,date)
  {
    if(!to) throw new Error("to undefined",from_.name,type.name);
    this.from = from_;
    this.type = type;
    this.to = to;
    this.claimer = claimer;
    // this.date = new Date(date);
    if(date && !(date instanceof Date)) date = new Date(date);
    this.date = date || new Date();

    if(Claim.onNewClaim) Claim.onNewClaim(this);
  }
  toCompactJson()
  {
    var f = this.from.id;
    var T = this.type.id;
    var t = this.to instanceof Node ? this.to.id
          : this.to && this.to.j    ? {j:String(this.to.j)}
          :                           this.to;
    var c = this.claimer.id;
    var d = this.date.valueOf();
    return {f,T,t,c,d};
  }
}
Claim.fromCompactJson = function(json)
{
  var from_ = Node.makeById(json.f);
  var type  = Node.makeById(json.T);
  var to    = _.isString(json.t) ? Node.makeById(json.t)
            : json.t && json.t.j ? {j:eval('('+json.t.j+')')}
            :                      json.t;
  var claimer = Node.makeById(json.c);
  var date = new Date(json.d);
  return new Claim(from_,type,to,claimer,date);
}


var _idToNodeIndex = {};
class Node
{
  constructor(id)
  {
    this.id = id || randHex();
    _idToNodeIndex[this.id] = this;
    this.typeTos = {};
    this.typeFroms = {};
  }
  get name()
  {
    return this.getFromType_string(_strid) || this.id;
  }
  setFromType(type,to,forceAsMultible=false)
  {
    return this.addClaim(new Claim(this,type,to,Node.defaultUser),forceAsMultible);
  }
  addClaim(claim,forceAsMultible=false)
  {
    var {type,to} = claim; // claim.from should be this
    if(to && to.s) willUpdateFullTextIndexForNode(this);

    if(type == _strid && to && to.s)
    {
      delete _nodeNameIndex[this.getFromType_string(_strid)];
      _nodeNameIndex[to.s] = this;
    }

    var claims = this.typeTos[type.id];
    if(!claims) claims = this.typeTos[type.id] = [];
    claim.sameTosClaims = claims;
    claims.push(claim);


    // add this to the new to's typeFroms index
    if(to instanceof Node)
    {
      var froms = to.typeFroms[type.id];
      if(!froms) froms = to.typeFroms[type.id] = {};
      var fClaims = froms[this.id];
      if(!fClaims) fClaims = froms[this.id] = [];
      froms[this.id].push(claim);
      // if(!froms) froms = to.typeFroms[type.id] = [];
      // TODO check already in ?
      // froms.push(this);
    }




    // var multipleValues = type.getFromType_to(_multipleValues) == _true || forceAsMultible;
    // // var multipleValues = to instanceof Node;
    // if(multipleValues)
    // {
    //   if(!(to instanceof Node)) return console.error("Node.setFromType() multipleValues of not Node unsupported yet.",this.name,type.name);
    //   if(!this.typeTos[type.id]) this.typeTos[type.id] = {};
    //   this.typeTos[type.id][to.id] = claim;
    //   // console.log("setFromType() multipleValues",this.typeTos[type.id]);
    //   // if(!this.typeTos[type.id]) this.typeTos[type.id] = [];
    //   // this.typeTos[type.id].push(to);
    // }
    // else
    // {
    //   // removes this from the old to's typeFroms index
    //   var oldClaim = this.typeTos[type.id];
    //   var oldTo = oldClaim && oldClaim.to;
    //   if(oldTo && oldTo instanceof Node)
    //   {
    //     var froms = oldTo.typeFroms[type.id];
    //     // if(froms) delete froms[this.id];
    //     // if(froms) _.remove(froms,this);
    //     // if(froms) _.remove(froms,oldClaim);
    //     if(froms) delete froms[this.id];
    //   }

    //   // reindex strid
    //   if(type == _strid)
    //   {
    //     delete _nodeNameIndex[this.getFromType_string(_strid)];
    //     _nodeNameIndex[to.s] = this;
    //   }

    //   if(to&&to.j) to.j = eval('('+String(to.j)+')');
    //   // if(to&&to.j) console.log(String(to.j));
    //   // if(to&&to.j) console.log(eval('('+String(to.j)+')'));
      
    //   // this.typeTos[type.id] = to;
    //   this.typeTos[type.id] = claim;
    // }



    if(Node.printoutInserts) console.log(_.padEnd(this.name,25),_.padEnd(type.name,15),valueToString(to).substring(0,40));
    // console.log(this.id,type.id,to instanceof Node ? to.id
    //   // : to.b !== undefined ? (to.b ? 'bool(true)' : 'bool(false)')
    //   : to.s               ? '"'+_.escape(to.s)+'"'
    //   : to.j               ? '*function*'
    //   : to.n               ? 'number('+to.n+')'
    //   :                      '*unknown*' );
  }

  getFromType_nodes(type)
  {
    var claims = this.typeTos[type.id];
    if(!claims) return [];
    // if(claims instanceof Claim) return [claims.to]; // unexpected
    return claims.map(claim=>claim.to);
    // var set = this.typeTos[type.id];
    // if(!(set instanceof Object)) return [];
    // return _.keys(set).map(id=>Node.makeById(id));
  }
  getFromType_to(type)
  {
    var claim = this.typeTos[type.id];
    if(!claim) return undefined; // TODO try to return _undefined to allow chaining
    // if(_.isArray(claim)) // should have at least 1 claim
      return _.first(claim).to;
    // if(!(this.typeTos[type.id] instanceof Claim))
    //   for(var key in claim)
    //     return claim[key].to;
    // return claim.to;
  }
  getFromType_boolean(type)
  {
    var to = this.getFromType_to(type);
    if(!(to instanceof Node)) return false;
    return to === _true;
  }
  getFromType_string(type)
  {
    var to = this.getFromType_to(type);
    if(!(to instanceof Object)) return false;
    if(!to.s) return undefined;
    return to.s;
  }
  getFromType_node(type)
  {
    var to = this.getFromType_to(type);
    if(!(to instanceof Node)) return undefined;
    return to;
  }
  getToType_froms(type)
  {
    // return this.typeFroms[type.id] || [];
    var set = this.typeFroms[type.id];
    if(!(set instanceof Object)) return [];
    return _.keys(set).map(id=>Node.makeById(id));
  }

  getFrom_types()
  {
    return _.keys(this.typeTos).map(id=>_idToNodeIndex[id]);
  }
  getTo_types()
  {
    return _.keys(this.typeFroms).map(id=>_idToNodeIndex[id]);
  }

  executeJsMethod(type,...args)
  {
    var jsMethod = type.getFromType_to(makeNode('claimType.resolve'));
    if(!(jsMethod instanceof Object)) return undefined;
    if(!jsMethod.j) return undefined;
    return jsMethod.j(this,...args);
  }

  $(i2,i3,i4)
  {
    return $$(this,i2,i3,i4);
  }

  $froms(type)
  {
    type = strToType(type,this); // should maybe not seach the to's instanciable methods…
    if(!type) return [];
    return this.getToType_froms(type);
  }

  $ex(method,...args)
  {
    method = strToType(method,this);
    var jsMethod = method.getFromType_to(makeNode('claimType.resolve'));
    // console.log("$ex",String(jsMethod.j))
    if(!(jsMethod instanceof Object)) return undefined;
    if(!jsMethod.j) return undefined;
    try
    {
      return jsMethod.j.call(this,...args);
    }
    catch(e)
    {
      console.error("$ex",method.name,e);
    }
  }
}
Node.makeById = id=> _idToNodeIndex[id] || new Node(id);

var _nodeNameIndex = {};



var _strid          = _nodeNameIndex["object.strid"]             = new Node('13d4c779');
var _multipleValues = _nodeNameIndex["claimType.multipleValues"] = new Node('d605bb65');
var _true           = _nodeNameIndex["true"]                     = new Node('8d377661');
var _kaielvin       = _nodeNameIndex["kaielvin"]                 = new Node('d086fe37');
Node.defaultUser = _kaielvin;

_strid         .setFromType(_strid,{s:"object.strid"});
_multipleValues.setFromType(_strid,{s:"claimType.multipleValues"});
_true          .setFromType(_strid,{s:"true"});
_kaielvin      .setFromType(_strid,{s:"kaielvin"});

function makeNode(name,id=undefined)
{
  if(!name) throw new Error("undefined name");
  if(name instanceof Node) return name;
  var node = _nodeNameIndex[name];
  if(node) return node;
  node = _idToNodeIndex[name];
  if(node) return node;
  if(id) node = _idToNodeIndex[id];
  if(!node) node = new Node(id);
  node.setFromType(_strid,{s:name});
  return _nodeNameIndex[name] = node;
}
function stridToNode(strid)
{
  return _nodeNameIndex[strid];
}
var _object = makeNode("object",'8dd2a277');
var _anything = makeNode("anything",'f0cfe989');
var _instanceOf = makeNode("object.instanceOf",'19c0f376');
var _instanciable = makeNode("instanciable",'ce0b87e4');
var _claimType = makeNode("claimType",'50fd3931');
var _typeFrom = makeNode("claimType.typeFrom",'59f08f21');
var _typeTo = makeNode("claimType.typeTo",'6d252ccf');
var _jsMethod = makeNode("jsMethod",'291f3841');
var _undefined = makeNode("undefined",'29f087a1');
var _claimType_defaultValue = makeNode("claimType.defaultValue",'d87ad258');
// var _multipleValues = makeNode("multipleValues",'d605bb65');
// var _true = makeNode("true",'8d377661');


function strToType(str,fromObject=undefined)
{
  // if(!str) throw new Error("undefined string input");
  if(!str) return undefined;
  if(str instanceof Node) return str;
  var typeObject = undefined;
  if(_.isString(str) && !str.includes('.')) str = '.'+str;
  if(_.isString(str) && str[0] == '.' && fromObject)
  {
    var instanciable = fromObject.getFromType_node(_instanceOf);
    if(instanciable) typeObject = stridToNode(instanciable.name+str);
    if(!typeObject) typeObject = stridToNode('object'+str);
    if(!typeObject) throw new Error('strToType() '+str+" not found on "+fromObject.name+" instanceof "+(instanciable&&instanciable.name));
  }
  else typeObject = makeNode(str);
  return typeObject;
}


/*

"a (b)" implies:
  "a instanceOf b"
  "b instanceOf instanciable"
"a > b > c" implies:
  "b instanceOf claimType"
  "b typeFrom a"
  "b typeTo c"
  "a instanceOf instanciable" if a != object
"a > b > c *" implies:
  "a > b > c"
  "b multipleValues true"
"a < b < c" implies:
  "c > b > a"

*/
function $$(i1,i2,i3,i4)
{
  if(!i1) return new Node();


  /*
  "c a.b" implies:
    "a > a.b > c"
  */
  var matchClaimType = _.isString(i1) && i1.match(/([^\ >]+(?: *\*|))\ ([^\.>]+)\.([^.>]+)/);
  // if(matchClaimType)
  //   console.log("$$ OVERRIDE",matchClaimType[2]+' > '+matchClaimType[2]+'.'+matchClaimType[3]+' > '+matchClaimType[1]);
  if(matchClaimType)
    return $$(matchClaimType[2]+' > '+matchClaimType[2]+'.'+matchClaimType[3]+' > '+matchClaimType[1],i2,i3,i4);

  /*
  "a > b > c" implies:
    "b instanceOf claimType"
    "b typeFrom a"
    "b typeTo c"
    "a instanceOf instanciable" if a != object
  "a > b > c *" implies:
    "a > b > c"
    "b multipleValues true"
  */
  var claimFromTo = _.isString(i1) && i1.split(">");
  if(claimFromTo && claimFromTo.length == 3)
  {
    claimFromTo[0] = _.trim(claimFromTo[0]);
    claimFromTo[1] = _.trim(claimFromTo[1]);
    claimFromTo[2] = _.trim(claimFromTo[2]);

    // var singleFrom = _.endsWith(claimFromTo[0],'-');
    // if(singleFrom)
    //   claimFromTo[0] = _.trim(claimFromTo[0].substring(0,claimFromTo[0].length-1));

    var multipleValues = _.endsWith(claimFromTo[2],'*');
    if(multipleValues)
      claimFromTo[2] = _.trim(claimFromTo[2].substring(0,claimFromTo[2].length-1));

    var typeFrom  = makeNode(claimFromTo[0]);
    var claimType = makeNode(claimFromTo[1]);
    var type__To  = makeNode(claimFromTo[2]);

    claimType.setFromType(_instanceOf,_claimType);
    if(typeFrom != _object)
      typeFrom.setFromType(_instanceOf,_instanciable);
    // claimType.setFromType(singleFrom ? _typeFromOne : _typeFrom,typeFrom);
    claimType.setFromType(_typeFrom,typeFrom);
    claimType.setFromType(_typeTo,  type__To);
    if(multipleValues)
      // claimType.setFromType($$('claimType.multipleValues'),{b:true});
      // claimType.setFromType($$('claimType.multipleValues'),makeNode('true'));
      claimType.setFromType(_multipleValues,_true);

    if(i2 && _.isFunction(i2))
    {
      $$(claimType,'claimType.functional','true');
      $$(claimType,'claimType.resolve',i2);
    }

    // return claimType;
    return typeFrom;
  }

  /*
  "a (b)" implies:
    "a instanceOf b"
    "b instanceOf instanciable"
  */
  var fromObject;
  var matchInstanceOf = _.isString(i1) && i1.match(/([^\(]+)\(([^\)]+)\)/);
  if(matchInstanceOf)
  {
    var fromObject = makeNode(_.trim(matchInstanceOf[1]));
    var instanciable = makeNode(_.trim(matchInstanceOf[2]));
    fromObject.setFromType(_instanceOf,instanciable);
  }
  


  if(!fromObject) fromObject = makeNode(i1);



  var typeObject;
  try
  {
    typeObject = strToType(i2,fromObject);
  }
  catch(e){ return undefined; }
  // console.log("$$()","i2",i2,"typeObject",typeObject)


  // make from type to claim
  if(i2 && i3)
  {
    var to = i3;

    // if(_.isFunction(to))
    //   // $$(fromObject.name+' -> '+typeObject.name+' > jsMethod');
    //   $$(fromObject,makeNode('functional'),makeNode('true'));

    if(_.isFunction(to)) to = {j:to};
    if(_.isString(to)) to = makeNode(to);
    fromObject.setFromType(typeObject,to);
    return fromObject;
  }
  
  // get from type, or execute jsMethod
  if(typeObject)
  {
    // if(typeObject.getFromType_node(_typeTo) == _jsMethod)
    if(typeObject.getFromType_node(makeNode('claimType.functional')) == makeNode('true'))
      // return fromObject.executeJsMethod(typeObject);
      return fromObject.$ex(typeObject,fromObject);
    else
    {
      var multipleValues = typeObject.getFromType_to(_multipleValues) == _true;
      if(multipleValues) return fromObject.getFromType_nodes(typeObject);

      var toValue = fromObject.getFromType_to(typeObject);
      toValue = toValue === undefined ? undefined
           : toValue.s ? toValue.s
           : toValue.j ? toValue.j
           : toValue.n ? toValue.n
           // : toValue.b ? toValue.b
           : toValue;

      if(!toValue && typeObject != _claimType_defaultValue)
        toValue = typeObject.$(_claimType_defaultValue);

      return toValue;
      // return fromObject.getFromType_node(typeObject);
    }
  }

  return fromObject;
}


var valueToHtml = value=>
  value instanceof Node ? $$(value,'object.link')
      : value === undefined ? 'undefined'
      : value.n ? ''+value.n
      // : value.b ? (value.b?'true':'false')
      : value.s ? '"'+value.s+'"'
      : value.j ? '*function*'
      // : value.b != undefined ? (value.b?'true':'false')
      : value; // should be number



function makeUnique(typeTos)
{
    // console.log('makeUnique()');
  // perform intersection of all the sets of (to,type)->froms
  // typeTos.forEach(([type,to])=>
  //   console.log('makeUnique()',$$(type,'object.prettyString'),$$(to,'object.prettyString'),$$(to).getToType_froms($$(type)).map( from=> $$(from,'object.prettyString') ) ) );
  var fromss = typeTos.map(([type,to])=>$$(to).getToType_froms($$(type)));
  fromss = _.sortBy(fromss,froms=>froms.length);
  // console.log('makeUnique()',fromss.map(froms=>froms.map( from=> $$(from,'object.prettyString') )));
  var uniques = fromss[0];
  for(var i=1;i<fromss.length && uniques.length > 0;i++)
  {
    uniques = _.intersection(uniques,fromss[i]);
    // console.log('makeUnique()','uniques.length',uniques.length);
  }

    // console.log('makeUnique()','uniques.length',uniques.length,uniques.length&&$$(uniques[0],'object.prettyString'));
  // one or more found
  if(uniques.length > 0) return uniques[0];

  // else create one
  var unique = $$();
  typeTos.forEach(([type,to])=>$$(unique,type,to));
  return unique;
}




module.exports = {ServerContext,fulltextSearch,
  randHex,valueToString,Claim,Node,makeNode,stridToNode,$$,valueToHtml,makeUnique,_idToNodeIndex,
  _object,_anything,_instanceOf,_instanciable,_claimType,_typeFrom,_typeTo,_jsMethod,};