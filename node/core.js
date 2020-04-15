var _ = _ || require('lodash'); // already defined on the frontend version



/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

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
      : value.n               ? 'n_'+value.n
      :                         'j_';
      // : value.j               ? 'j_'
      // :                         'b_'+value.b;


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
  setFromType(type,to)
  {
    // TODO check type.multipleValues and override if not true
    // if(!this.typeTos[type.id]) this.typeTos[type.id] = {};
    // if()

    // removes this from the old to's typeFroms index
    var oldTo = this.typeTos[type.id];
    if(oldTo && oldTo instanceof Node)
    {
      var froms = oldTo.typeFroms[type.id];
      // if(froms) delete froms[this.id];
      if(froms) _.remove(froms,this);
    }

    // reindex strid
    if(type == _strid)
    {
      delete _nodeNameIndex[this.getFromType_string(_strid)];
      _nodeNameIndex[to.s] = this;
    }

    if(to&&to.j) to.j = eval(String(to.j));

    this.typeTos[type.id] = to;

    // add this to the new to's typeFroms index
    if(to instanceof Node)
    {
      var froms = to.typeFroms[type.id];
      // if(!froms) froms = to.typeFroms[type.id] = {};
      // froms[this.id] = true;
      if(!froms) froms = to.typeFroms[type.id] = [];
      // TODO check already in ?
      froms.push(this);
    }

    console.log(_.padEnd(this.name,25),_.padEnd(type.name,15),valueToString(to));
    // console.log(this.id,type.id,to instanceof Node ? to.id
    //   // : to.b !== undefined ? (to.b ? 'bool(true)' : 'bool(false)')
    //   : to.s               ? '"'+_.escape(to.s)+'"'
    //   : to.j               ? '*function*'
    //   : to.n               ? 'number('+to.n+')'
    //   :                      '*unknown*' );
  }
  getFromType_to(type)
  {
    return this.typeTos[type.id];
  }
  getFromType_boolean(type)
  {
    var to = this.typeTos[type.id];
    if(!(to instanceof Node)) return false;
    return to === $$('true');
  }
  getFromType_string(type)
  {
    var to = this.typeTos[type.id];
    if(!(to instanceof Object)) return false;
    if(!to.s) return undefined;
    return to.s;
  }
  getFromType_node(type)
  {
    var to = this.typeTos[type.id];
    if(!(to instanceof Node)) return undefined;
    return to;
  }
  getToType_froms(type)
  {
    return this.typeFroms[type.id] || [];
  }

  getFrom_types()
  {
    return _.keys(this.typeTos).map(id=>_idToNodeIndex[id]);
  }
  getTo_types()
  {
    return _.keys(this.typeFroms).map(id=>_idToNodeIndex[id]);
  }

  executeJsMethod(type)
  {
    var jsMethod = type.getFromType_to(makeNode('claimType.resolve'));
    if(!(jsMethod instanceof Object)) return undefined;
    if(!jsMethod.j) return undefined;
    return jsMethod.j(this);
    // var instanciable = _object;
    // var jsMethod = instanciable.typeTos[type.id];
    // if(!(jsMethod instanceof Object)) return undefined;
    // if(!jsMethod.j) return undefined;
    // return jsMethod.j(this);
  }

  $(i2,i3,i4)
  {
    return $$(this,i2,i3,i4);
  }
}
Node.makeById = id=> _idToNodeIndex[id] || new Node(id);

var _nodeNameIndex = {};
var _strid = _nodeNameIndex["object.strid"] = new Node('13d4c779');
_strid.setFromType(_strid,{s:"object.strid"});
function makeNode(name,id=undefined)
{
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
  var matchClaimType = _.isString(i1) && i1.match(/([^\ >]+)\ ([^\.>]+)\.([^.>]+)/);
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
      claimType.setFromType($$('claimType.multipleValues'),{b:true});

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
  if(_.isString(i2) && !i2.includes('.')) i2 = '.'+i2;
  if(_.isString(i2) && i2[0] == '.')
  {
    var instanciable = fromObject.getFromType_node(_instanceOf);
    if(instanciable) typeObject = stridToNode(instanciable.name+i2);
    if(!typeObject) typeObject = stridToNode('object'+i2);
    if(!typeObject) console.error('$$()',i2,"not found on",fromObject.name);
    if(!typeObject) return;
  }
  else typeObject = makeNode(i2);

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
  if(i2)
  {
    // if(typeObject.getFromType_node(_typeTo) == _jsMethod)
    if(typeObject.getFromType_node(makeNode('claimType.functional')) == makeNode('true'))
      return fromObject.executeJsMethod(typeObject);
    else
    {
      var toValue = fromObject.getFromType_to(typeObject);
      return toValue === undefined ? undefined
           : toValue.s ? toValue.s
           : toValue;
      // return fromObject.getFromType_node(typeObject);
    }
  }

  return fromObject;
}


var valueToHtml = value=>
  value instanceof Node ? $$(value,'object.link')
      : value === undefined ? 'undefined'
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




module.exports = {htmlToElement,randHex,valueToString,Node,makeNode,stridToNode,$$,valueToHtml,makeUnique,_idToNodeIndex,
  _object,_anything,_instanceOf,_instanciable,_claimType,_typeFrom,_typeTo,_jsMethod,};