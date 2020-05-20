var _ = _ || require('lodash'); // already defined on the frontend version
var MiniSearch = MiniSearch || require('minisearch'); // already defined on the frontend version
var fetch = fetch || require("node-fetch");

String.prototype.strcmp = function(s) {
    return this < s ? -1 : +(this > s)
}


var SortedSet = require && require("collections/sorted-set");



// used by JS methods in the graph to access server specific values and functions
var ServerContext = {};

/**
 * @param {String} HTML representing a single element
 * @return {Element}
 */


function hash(str)
{
  var hash = 5381,
      i    = str.length;

  while(i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
   * integers. Since we want the results to be always positive, convert the
   * signed int to an unsigned by doing an unsigned bitshift. */
  return hash >>> 0;
}
// var all01Sum = 0;
// var all01Count = 0;
function hashHex(str)
{
  var hashNum = hash(str);
  var hashStr = hashNum.toString(16);
  while(hashStr.length < 8) hashStr = '0'+hashStr;
  // all01Sum+= hashTo01(hashStr);
  // all01Count++;
  // console.log(hashStr,hashTo01(hashStr),all01Sum/all01Count);
  return hashStr;
}
// expected a 8 char hexadecimal
function hashTo01(hashStr)
{
  const ffffffff = 4294967295;
  var hashNum = parseInt(hashStr, 16);
  return hashNum / ffffffff;
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
      : value.u !== undefined ? 'unset'
      : value.s !== undefined ? 's_'+value.s
      // : value.b               ? 'b_'+value.b
      : value.n !== undefined ? 'n_'+value.n
      :                         'j_';
      // : value.j               ? 'j_'
      // :                         'b_'+value.b;



var fulltextSearchOptions = {
  fields: ['strid', 'title', 'instanciable', 'description'], // fields to index for full-text search
  storeFields: ['id'], // fields to return with search results
  searchOptions: {
    // boost: { strid: 10, title: 8, instanciable: 2, description: 1 },
    boost: { strid: 100, title: 10, instanciable: 5, description: 1 },
    prefix: true,
    fuzzy: 0.2,
  }
};
var fulltextSearch = new MiniSearch(fulltextSearchOptions);
fulltextSearch.__options = fulltextSearchOptions;
fulltextSearch.documentById = {};
function resetFulltextSearchObject(_fulltextSearch) // used by loader from disk
{
  fulltextSearch = _fulltextSearch;
}

var nodeTofullTextDocument = node=>
{
  var instanciable = node.$('instanceOf');
  if(instanciable == $$('person')) return null; // making the index buggy at the moment
  var doc = {id:node.id};
  doc.strid = node.strid;
  doc.title = node.$('title');
  doc.instanciable = instanciable && instanciable.strid;
  doc.description = node.$('description');
  if(doc.strid && !_.isString(doc.strid))
  {
    console.error("nodeTofullTextDocument()",node.id,"doc.strid && !_.isString(doc.strid)",JSON.stringify(doc.strid));
    return null;
  }
  if(doc.title && !_.isString(doc.title))
  {
    console.error("nodeTofullTextDocument()",node.id,"doc.title && !_.isString(doc.title)",JSON.stringify(doc.title));
    return null;
  }
  if(doc.instanciable && !_.isString(doc.instanciable))
  {
    console.error("nodeTofullTextDocument()",node.id,"doc.instanciable && !_.isString(doc.instanciable)",JSON.stringify(doc.instanciable));
    return null;
  }
  if(doc.description && !_.isString(doc.description))
  {
    console.error("nodeTofullTextDocument()",node.id,"doc.description && !_.isString(doc.description)",JSON.stringify(doc.description));
    return null;
  }
  if(!doc.strid && !doc.title && !doc.instanciable && !doc.description) return null; // only the id, not interesting
  return doc;
}
var nodesToFullTextIndex = {};
var willUpdateFullTextIndexForNode = node=>
{
  if(fulltextSearch.skipIndexing) return; // used during loading of the graph, when the index is restored from disk

  var id = node.id;

  if(!nodesToFullTextIndex[id])
  nodesToFullTextIndex[id] = _.debounce(()=>
  {
    if(fulltextSearch.documentById[id])
    {
      // console.log("willUpdateFullTextIndexForNode()","removing",JSON.stringify(fulltextSearch.documentById[id]));
      fulltextSearch.remove(fulltextSearch.documentById[id]);
      if(fulltextSearch.onDocRemoved)
        fulltextSearch.onDocRemoved(doc);
    }
    var doc = fulltextSearch.documentById[id] = nodeTofullTextDocument(node);
    if(doc)
    {
      // console.log("willUpdateFullTextIndexForNode()","adding",JSON.stringify(doc),_.size(doc),_.size({...doc}));
      fulltextSearch.add(doc);
      if(fulltextSearch.onDocAdded)
        fulltextSearch.onDocAdded(doc);
    }
    // console.log("FULLTEXT",JSON.stringify(doc));
    delete nodesToFullTextIndex[id];
  }
  ,500);

  nodesToFullTextIndex[id]();
}

 









class ClaimStore
{
  constructor()
  {
    // this.claims = [];
    // this.idPosIndex = {}; // used to remove quickly
    this.idIndex = {};
    this.addClaim = this.addClaim.bind(this);

    this.addAllNodeClaims = this.addAllNodeClaims.bind(this);
  }
  get length()
  {
    // return this.claims.length;
    return _.size(this.idIndex); // slow (add a counter if needed often)
  }
  getFromId(id)
  {
    return this.idIndex[id];
  }
  addClaim(claim)
  {
    var id = claim.id;
    if(this.idIndex[id]) return this;
    this.idIndex[id] = claim;
    // this.idPosIndex[id] = this.claims.length;
    // this.claims.push(claim);
    return this;
  }
  _addClaim(claim,id=undefined) // no checking, faster
  {
    var id = id || claim.id;
    this.idIndex[id] = claim;
    // this.idPosIndex[id] = this.claims.length;
    // this.claims.push(claim);
    return this;
  }
  removeClaim(claim,id=undefined)
  {
    var id = id || claim.id;
    var _claim = this.idIndex[id];
    if(!_claim) return this;
    // _.remove(this.claims,_claim);
    // if(this.claims[this.idPosIndex[id]].id != id)
      // console.error("ClaimStore.removeClaim()",'pos',this.idPosIndex[id],
      //   "IDS",id,this.claims[this.idPosIndex[id]].id,
      //   "idStrs",claim.idStr,this.claims[this.idPosIndex[id]].idStr);

    // this.claims.splice(this.idPosIndex[id],1);
    delete this.idIndex[id];
    // delete this.idPosIndex[id];
    return this;
  }

  addAllNodeClaims(node,includeFroms=false)
  {
    for(var typeId in node.typeTos)
      node.typeTos[typeId].forEach(this.addClaim);
    if(includeFroms)
    for(var typeId in node.typeFroms)
    {
      var perFromClaims = node.typeFroms[typeId];
      for(var fromId in perFromClaims)
        perFromClaims[fromId].forEach(this.addClaim);
    }
  }
  getAll(sortedByDate=false)
  {
    var claims = _.values(this.idIndex);
    if(sortedByDate) claims = _.sortBy(claims,c=>c.date.valueOf());
    return claims;
  }
  toCompactJson()
  {
    var claimJsons = [];
    var lastClaimJsons = {d:0};
    var values = [];
    var valuesMap = {};
    var makeValueId = value=>
    {
      var str = _.isString(value) ? value : JSON.stringify(value);
      var id = valuesMap[str];
      if(id !== undefined) return id;
      id = valuesMap[str] = values.length;
      values.push(value);
      return id;
    }
    // TODO could order to compact better.
    // trusting the default order for now.
    // chronological order is slightly better, activated for now
    var claims = this.getAll(true);
    for(var claim of claims)
    {
      var claimJson = claim.toCompactJson();
      claimJson.f = makeValueId(claimJson.f);
      claimJson.T = makeValueId(claimJson.T);
      claimJson.t = makeValueId(claimJson.t);
      claimJson.c = makeValueId(claimJson.c);
      
      if(claimJson.f === lastClaimJsons.f) delete claimJson.f;
      else lastClaimJsons.f = claimJson.f;
      if(claimJson.T === lastClaimJsons.T) delete claimJson.T;
      else lastClaimJsons.T = claimJson.T;
      if(_.isEqual(claimJson.t,lastClaimJsons.t)) delete claimJson.t;
      else lastClaimJsons.t = claimJson.t;
      if(claimJson.c === lastClaimJsons.c) delete claimJson.c;
      else lastClaimJsons.c = claimJson.c;
      if(claimJson.d === lastClaimJsons.d) delete claimJson.d;
      else
      {
        var lastDate = claimJson.d;
        // diff is shorter
        claimJson.d-= lastClaimJsons.d;
        lastClaimJsons.d = lastDate;
      }

      claimJsons.push(claimJson);
    }
    return {claims:claimJsons,values,v:1};
  }
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

    Object.freeze(this);
  }
  equals(c2)
  {
    if(c2.from != this.from) return false;
    if(c2.type != this.type) return false;
    if(c2.to.j && this.to.j)
    {
      if(c2.to.j.toString() != this.to.j.toString()) return false;
    }
    else
    {
      if(!_.isEqual(c2.to,this.to)) return false;
    }
    if(c2.date.valueOf() != this.date.valueOf()) return false;
    if(c2.claimer != this.claimer) return false;
    return true;
  }
  compareFromTypeDateToClaimer(c2)
  {
    if(Claim.compareCounter != undefined) Claim.compareCounter++;
    var f1 = this.from;
    var f2 = c2.from;
    if(f1 != f2) return f1.id>f2.id ? +1 : -1;
    var T1 = this.type;
    var T2 = c2.type;
    if(T1 != T2) return T1.id>T2.id ? +1 : -1;
    var d1 = this.date.valueOf();
    var d2 = c2.date.valueOf();
    if(d1 != d2) return d1>d2 ? +1 : -1;
    var t1 = this.to;
    var t2 = c2.to;
    if(t1 !== t2) // same pointers, skip comparing values
    {
      var t1N = t1 instanceof Node;
      var t2N = t2 instanceof Node;
      if(t1N && t2N)
      {
        if(t1 != t2) return t1.id>t2.id ? +1 : -1;
      }
      else
      {
        // nodes, then primitive values
        if(t1N) return -1; 
        if(t2N) return +1;
        var t1Type;
        var t2Type;
        for(var k in t1){ t1Type = k; break; }
        for(var k in t2){ t2Type = k; break; }
        // sort by primitive type string key, arbitrarily
        if(t1Type != t2Type) return t1Type.strcmp(t2Type);
        switch(t1Type)
        {
          case 's':
            if(t1.s != t2.s) return t1.s>t2.s ? +1 : -1;
            break;
          case 'u':
            if(t1.u != t2.u) return t1.u>t2.u ? +1 : -1; // TODO check this
            break;
          case 'n':
            if(t1.n != t2.n) return t1.n>t2.n ? +1 : -1;
            break;
          case 'j':
            if(t1.j === t2.j) break;
            var j1 = t1.j.toString();
            var j2 = t2.j.toString();
            if(j1 != j2) return j1>j2 ? +1 : -1;
            // throw new Error('j not supported yet');
            break;
        }
      }
    }
    // to values are presumably equal by now

    var c1 = this.claimer;
    var c2 = c2.claimer;
    if(c1 != c2) return c1.id>c2.id ? +1 : -1;

    // Equal!
    return 0;
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
  get idStr()
  {
    var j = this.toCompactJson();
    return j.f
      +' '+j.T
      +' '+(_.isString(j.t)?j.t:JSON.stringify(j.t))
      +' '+j.c
      +' '+j.d;
  }
  get id()
  {
    var j = this.toCompactJson();
    var str = j.f
      +' '+j.T
      +' '+(_.isString(j.t)?j.t:JSON.stringify(j.t))
      +' '+j.c
      +' '+j.d
    // console.log(str);
    return hashHex(str);
  }
  // delete(skipRemovingFromNode=true)
  // {
  //   if(!Claim.hideDeleteLogs) console.log("Claim.delete()",this.id,this.type.strid,this.idStr);
  //   // this.deleted = true;
  //   var removed = this.from.removeClaim(this);
  //   if(removed) Claim.count--;
  //   else return;

  //   if(Claim.onNewClaim) Claim.onNewClaim(this,true);
  //   // var id = this.id;
  //   // delete Claim.idIndex[id];
  //   // Claim.mainClaimStore.removeClaim(this);
  //   // Claim.deletedIdIndex[id] = this;
  // }
  toString()
  {
    return this.idStr;
  }
}

if(SortedSet)
  Claim.fromTypeToSet = new SortedSet(undefined,function(c1,c2){return c1.equals(c2)},function(c1,c2){return c1.compareFromTypeDateToClaimer(c2)});


// Claim.mainClaimStore = new ClaimStore();
// Claim.deletedIdIndex = {};
// Claim.idIndex = {};
Claim.count = 0;
Claim.make = function(from_,type,to,claimer,date)
{
  var claim = new Claim(from_,type,to,claimer,date);
  // var fromStore = Claim.mainClaimStore.getFromId(id);
  // if(fromStore) return fromStore;
  var result = claim.from.addClaim(claim);
  if(result.alreadyIn)
  {
    console.log("Claim.make() already exists");
    return result.alreadyIn;
  }
  Claim.count++;
  // console.log("Claim.make() Claim.count++",Claim.count);
  // var id = claim.id;
  // Claim.mainClaimStore._addClaim(claim,id);
  // if(Claim.fromTypeToSet) Claim.fromTypeToSet.push(claim);
  if(Claim.onNewClaim) Claim.onNewClaim(claim);
  return claim;

  // var id = claim.id;
  // var fromIndex = Claim.idIndex[id];
  // if(fromIndex) return fromIndex; // already indexed
  // claim.from.addClaim(claim);
  // if(Claim.onNewClaim) Claim.onNewClaim(claim);
  // return Claim.idIndex[id] = claim;
}
Claim.remove = function(claim) // by value
{
  // console.log("Claim.remove()",claim.id,claim.idStr);
  if(!Claim.hideDeleteLogs) console.log("Claim.remove()",claim.id,claim.idStr);
  var from_ = claim.from;
  var removed = from_.removeClaim(claim);
  if(!removed) return false;
  Claim.count--;
  var to = claim.to;
  // TODO handle the potential situation where node held somewhere and temporarily empty
  if(                   from_.isEmpty()) delete _idToNodeIndex[from_.id];
  if(to instanceof Node && to.isEmpty()) delete _idToNodeIndex[to   .id];
  // console.log("Claim.remove() Claim.count--",Claim.count);
  if(Claim.onNewClaim) Claim.onNewClaim(removed,true);
  return true;
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

  if(json.del)
  {
    var claim = new Claim(from_,type,to,claimer,date);
    return Claim.remove(claim);
  }

  var claim = Claim.make(from_,type,to,claimer,date);
  return claim;
}

class Node
{
  constructor(id)
  {
    if(!id) throw new Error("id undefined");
    // this.id = id || randHex();
    this.id = id;
    this.typeTos = {};
    this.typeFroms = {};
    this.typeFromsCounts = {};
  }
  get name()
  {
    // return this.getFromType_string(_strid) || this.id;
    return this.strid || this.id;
  }
  setFromType(type,to)
  {
    // return this.addClaim(Claim.make(this,type,to,Node.defaultUser));
    var claim = Claim.make(this,type,to,Node.defaultUser); // will call this.addClaim() if needed
    // console.log("Node.setFromType()","claim",claim.id,claim.idStr);
  }
  removeClaim(claim)
  {
    return this.addClaim(claim,true);
  }
  addClaim(claim,_remove=false)
  {
    var {type,to} = claim; // claim.from should be this

    var claims = this.typeTos[type.id];
    if(_remove && !claims) return undefined; // nothing to remove
    if(_remove)
    {
      var lengthBefore = claims.length;
      // _.pull(claims,claim);
      // _.pullAllBy(claims,claim,c=>c.equals(claim)); // TODO optimise
      var removed = _.remove(claims,c=>c.equals(claim)); // TODO optimise
      // console.log("Node.removeClaim()","lengthBefore",lengthBefore,"claims.length",claims.length);
      if(lengthBefore == claims.length) return undefined; // nothing removed
      if(claims.length == 0)
      {
        delete this.typeTos[type.id];
        claims = undefined;
      }
      claim = removed[0]; // to use comparisons by reference instead of value below, and for returning the actual removed claim
    }

    if(!_remove && claims)
    {
      var alreadyIn = claims.find(c=>c.equals(claim)); // TODO optimize
      if(alreadyIn) return {alreadyIn};
    }
    if(!_remove)
    {
      if(!claims) claims = this.typeTos[type.id] = [];
      // claim.sameTosClaims = claims;
      claims.push(claim);
    }



    if(to && to.s) willUpdateFullTextIndexForNode(this);

    // if(type == _strid && to && to.s)
    // if(type == _strid && to && to.s && this.stridDate)
    //   console.log("reset strid (Node.addClaim)",this.id,"strid",claim.id,claim.date,this.strid,'=>',to.s,this.stridDate);


    // this claim (being removed) was the strid one, find the previous one
    if( _remove && type == _strid
       && this.stridClaim == claim)
    {
      // console.log('Node.addClaim() _remove','REMOVE STRID',claim.to.s);

      // claim has been removed from claims already (undefined if empty)
      var previous = !claims ? undefined : _.maxBy(claims,c=>c==c.date.valueOf())
      if(!previous) // was the only one, removing strid data
      {
        delete _stridClaims[claim.to.s];
        delete this.strid;
        delete this.stridClaim;
        delete this.stridDate;
      }
      else
      {
        delete _stridClaims[claim.to.s];
        var newStrid = previous.to.s;
        _stridClaims[newStrid] = previous;
        this.strid = newStrid;
        this.stridClaim = previous;
        this.stridDate = previous.date;
      }
    }

    if(!_remove && type == _strid && to && to.s
      && (!this.stridDate || claim.date.valueOf() > this.stridDate.valueOf())
      && (!_stridClaims[to.s] || claim.date.valueOf() > _stridClaims[to.s].date.valueOf()))
    {
      delete _stridClaims[this.strid];
      _stridClaims[to.s] = claim;
      this.strid = to.s;
      this.stridClaim = claim;
      this.stridDate = claim.date;
    }



    // add this to the new to's typeFroms index
    if(to instanceof Node)
    {
      var froms = to.typeFroms[type.id];
      if(!froms) froms = to.typeFroms[type.id] = {};
      var fClaims = froms[this.id];
      if(!fClaims) fClaims = froms[this.id] = []; // should not happen if _remove
      if(!_remove) fClaims.push(claim);
      else         _.pull(fClaims,claim);
      if(fClaims.length == 0)
      {
        delete froms[this.id];
        if(_.size(froms) == 0) delete to.typeFroms[type.id];
      }
      to.typeFromsCounts[type.id] = (to.typeFromsCounts[type.id]||0)+(_remove?-1:+1);

      // clean up
      if(_remove)
      {
        if(fClaims.length == 0)
        {
          delete froms[this.id];
          if(_.size(froms) == 0) delete to.typeFroms[type.id];
        }
        if(to.typeFromsCounts[type.id] == 0)
          delete to.typeFromsCounts[type.id];
      }

      // if(!froms) froms = to.typeFroms[type.id] = [];
      // TODO check already in ?
      // froms.push(this);
    }
    // if(Node.printoutInserts) console.log(_.padEnd(this.name,25),_.padEnd(type.name,15),valueToString(to).substring(0,40));

    return claim;
  }

  * makeClaimIterator()
  {
    for(var typeId in this.typeTos)
    {
      var claims = this.typeTos[typeId];
      for(var claim of claims) yield claim;
    }
  }
  isEmpty()
  {
    // this.typeTos and this.typeFroms should be empty, but checking for empty arrays anyway (fast)
    for(var typeId in this.typeTos)
      if(this.typeTos[typeId].length > 0) return false;
    for(var typeId in this.typeFroms)
    {
      var froms = this.typeFroms[typeId];
      for(var fromId in froms)
        if(froms[fromId].length > 0) return false;
    }
    return true;
  }
  fromTypeClaimCount()
  {
    var total = 0;
    for(var typeId in this.typeTos)
      total+= this.typeTos[typeId].length;
    return total;
  }
  toTypeClaimCount()
  {
    var total = 0;
    for(var typeId in this.typeFroms)
    {
      var fromss = this.typeFroms[typeId];
      for(var fromId in froms)
        total+= froms[fromId].length;
    }
    return total;
  }

  getFromType_nodes(type,unique=true,byDate=true)
  {
    var claims = this.typeTos[type.id];
    if(!claims) return [];
    if(claims.length == 0) return undefined;

    if(unique) claims = _.uniqBy(claims,c=>c.to.id);
    if(byDate) claims = _.sortBy(claims,c=>c.date.valueOf());
    // if(claims instanceof Claim) return [claims.to]; // unexpected
    // var tosMap = {}
    // for(var claim of claims)
    //   tosMap[claim.to.id] = claim;
    // var tos = [];
    // for(var toId in tosMap)
    //   tos.push(tosMap[toId]);
    // return tos;
    return claims.map(claim=>claim.to);
    // var set = this.typeTos[type.id];
    // if(!(set instanceof Object)) return [];
    // return _.keys(set).map(id=>Node.makeById(id));
  }
  getFromType_to(type)
  {
    var claims = this.typeTos[type.id];
    if(!claims) return undefined; // TODO try to return _undefined to allow chaining
    if(claims.length == 0) return undefined;
    // if(_.isArray(claim)) // should have at least 1 claim
    // if(claims.length > 1 && claims[0].to && claims[0].to.s)
    //   console.log("getFromType_to() claims.length > 1",this.name,'>',type.name,'>',
    //     claims.map(claim=>claim.to && claim.to.s).join(' — '));
    var to = _.maxBy(claims,c=>c.date.valueOf()).to;
    return to.u ? undefined : to;
    // return _.last(claim).to;
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
  getToType_fromsCount(type) // approximate as currently not handling resets
  {
    return this.typeFromsCounts[type.id]||0;
  }
  getToType_froms(type) // approximate as currently not handling resets
  {
    // return this.typeFroms[type.id] || [];
    var set = this.typeFroms[type.id];
    if(!(set instanceof Object)) return [];
    return _.keys(set).map(id=>Node.makeById(id));
  }
  hasFrom(type,_from) // approximate as currently not handling resets, if claims are ordered, just look at the last one
  {
    var set = this.typeFroms[type.id];
    if(!(set instanceof Object)) return false;
    return set[_from.id] != undefined;
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
    var jsMethod = type.getFromType_to(_resolve);
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
    type = strToType(type,this); // should maybe not search the to's instanciable methods…
    if(!type) return [];
    return this.getToType_froms(type);
  }

  $ex(method,...args)
  {
    method = strToType(method,this);
    var _function = method.getFromType_to(_fieldFunction);
    if(_function)
    {
      var expression = _function.$(_functionExpr);
      if(expression)
      {
        var context = {};
        var variable = _function.$(_functionVar);
        if(variable) context[variable.id] = [this];
        return expression.$ex('resolve',context);
      }
    }
    var jsMethod = method.getFromType_to(_resolve);
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
  // useful instead of $ex only to catch errors automatically
  async $exAsync(method,...args)
  {
    method = strToType(method,this);
    var jsMethod = method.getFromType_to(_resolve);
    // console.log("$ex",String(jsMethod.j))
    if(!(jsMethod instanceof Object)) return undefined;
    if(!jsMethod.j) return undefined;
    try
    {
      return await jsMethod.j.call(this,...args);
    }
    catch(e)
    {
      console.error("$exAsync",method.name,e);
    }
  }

  toString()
  {
    return this.id+': '+this.$('prettyString');
  }

  delete()
  {
    // console.log("Node.delete()",this.id,this.strid,this.$('prettyString'));
    for(var typeId in this.typeTos)
    {
      // console.log("Node.delete()","toType",Node.makeById(typeId).strid,this.typeTos[typeId].length);
      var claims = [...this.typeTos[typeId]];
      claims.forEach(Claim.remove);
    }
    // leave them point to an empty node
    // they should be carbage collectable if this node is deleted anyway
    // for(var typeId in this.typeFroms)
    // {
    //   console.log("Node.delete()","fromType",Node.makeById(typeId).strid);
    //   var perFromClaims = this.typeFroms[typeId];
    //   for(var fromId in perFromClaims)
    //   {
    //     var claims = [...perFromClaims[fromId]];
    //     claims.forEach(deleteClaim);
    //   }
    // }

    delete _idToNodeIndex[this.id]; // object potentially kept by from indexes
  }
}


Node.zero = new Node("00000000");
Node.one  = new Node("ffffffff");

var _idToNodeIndex = {};
Node.makeById = id=>
{
  var node = _idToNodeIndex[id];
  if(node) return node;
  return _idToNodeIndex[id] = new Node(id);
}
Node.makeByStrid = strid=>
{
  var stridClaim = _stridClaims[strid];
  if(stridClaim) return stridClaim.from;
  var node = Node.make();
  node.setFromType(_strid,{s:strid});
  return node;
}
Node.getByStrid = strid=>
{
  return _stridClaims[strid];
}
Node.getById = id=>
{
  return _idToNodeIndex[id];
}
Node.make = ()=> Node.makeById(randHex());

var _stridClaims = {};

function * makeOverallClaimIterator()
{
  for(var nodeId in _idToNodeIndex)
  {
    var nodeClaimIterator = _idToNodeIndex[nodeId].makeClaimIterator();
    for(var claim of nodeClaimIterator) yield claim;
  }
}
Claim.makeOverallClaimIterator = makeOverallClaimIterator;



function makeNode(name,id=undefined)
{
  if(!name) throw new Error("undefined name");
  if(name instanceof Node) return name;
  var stridClaim = _stridClaims[name];
  if(stridClaim) return stridClaim.from;
  node = _idToNodeIndex[name];
  if(node) return node;
  if(id) node = _idToNodeIndex[id];
  if(!node) node = id ? Node.makeById(id) : Node.make();
  if(node.strid != name)
    node.setFromType(_strid,{s:name});
  return node;
}
function resolveIntoNode(value)
{
  if(value instanceof Node) return value;
  var stridClaim = _stridClaims[value];
  if(stridClaim) return stridClaim.from;
  var node = _idToNodeIndex[value];
  if(node) return node;
  return undefined;
}
function stridToNode(strid)
{
  var stridClaim = _stridClaims[strid];
  return stridClaim && stridClaim.from;
}


// var _strid          = _stridClaims["object.strid"]             = Node.makeById('13d4c779');
// var _multipleValues = _stridClaims["claimType.multipleValues"] = Node.makeById('d605bb65');
// var _true           = _stridClaims["true"]                     = Node.makeById('8d377661');
// var _kaielvin       = _stridClaims["kaielvin"]                 = Node.makeById('d086fe37');

var _strid          = Node.makeById('13d4c779');
var _multipleValues = Node.makeById('d605bb65');
var _true           = Node.makeById('8d377661');
var _object         = Node.makeById('8dd2a277');
var _class          = Node.makeById('7ee96d65');
var _abstractClass  = Node.makeById('e3246c5f');
var _subClassOf     = Node.makeById('2c90c5b8');
var _classes        = Node.makeById('b4d463ea');
var _supClasses     = Node.makeById('cb40bedd');
var _anything       = Node.makeById('f0cfe989');
var _instanceOf     = Node.makeById('19c0f376');
var _instanciable   = Node.makeById('ce0b87e4');
var _claimType      = Node.makeById('50fd3931');
var _fieldFunction  = Node.makeById('dafc06f4');
var _functionVar    = Node.makeById('a7af3fc9');
var _functionExpr   = Node.makeById('31552381');
var _typeFrom       = Node.makeById('59f08f21');
var _typeTo         = Node.makeById('6d252ccf');
var _jsMethod       = Node.makeById('291f3841');
var _undefined      = Node.makeById('29f087a1');
var _defaultValue   = Node.makeById('d87ad258');
var _functional     = Node.makeById('bc92e4bd');
var _resolve        = Node.makeById('d26ffe55');
var _kaielvin       = Node.makeById('d086fe37');
var _claimDisabled  = Node.makeById('4f494962');
var _claimDeprecated= Node.makeById('6f450862');

Node.defaultUser = _kaielvin;

// Node.initCore = function()
// {
//   _strid            .setFromType(_strid,{s:"object.strid"});
//   _multipleValues   .setFromType(_strid,{s:"claimType.multipleValues"});
//   _true             .setFromType(_strid,{s:"true"});
//   _object           .setFromType(_strid,{s:"object"});
//   _class            .setFromType(_strid,{s:"class"});
//   _abstractClass    .setFromType(_strid,{s:"abstractClass"});
//   _subClassOf       .setFromType(_strid,{s:"subClassOf"});
//   _anything         .setFromType(_strid,{s:"anything"});
//   _instanceOf       .setFromType(_strid,{s:"object.instanceOf"});
//   _instanciable     .setFromType(_strid,{s:"instanciable"});
//   _claimType        .setFromType(_strid,{s:"claimType"});
//   _typeFrom         .setFromType(_strid,{s:"claimType.typeFrom"});
//   _typeTo           .setFromType(_strid,{s:"claimType.typeTo"});
//   _jsMethod         .setFromType(_strid,{s:"jsMethod"});
//   _undefined        .setFromType(_strid,{s:"_undefined"});
//   _defaultValue     .setFromType(_strid,{s:"claimType.defaultValue"});
//   _functional       .setFromType(_strid,{s:"claimType.functional"});
//   _resolve          .setFromType(_strid,{s:"claimType.resolve"});
//   _kaielvin         .setFromType(_strid,{s:"kaielvin"});

//   // var _multipleValues = makeNode("multipleValues",'d605bb65');
//   // var _true = makeNode("true",'8d377661');
// }

function strToType(str,node=undefined,classes=undefined)
{
  if(!str) throw new Error("undefined string input");
  if(str instanceof Node) return str;
  if(!_.isString(str)) throw new Error('not a string');
  if(str[0] == '.') str = str.substring(1); // deprecated, might still be used
  if(str.includes('.'))
  {
    var type = stridToNode(str);
    if(!type) throw new Error('not found ("'+str+'")');
    return type;
  }
  if(node||classes)
  {
    classes = classes || node.$ex(_classes);
    if(classes instanceof Node)
    {
      console.error(new Error("strToType() deprecated use of strToType with instanciable (provide classes or nothing), provided: "+classes.name));
      classes = classes.$('class.supClasses');
    }
    if(!_.isArray(classes)) console.error("strToType()","!_.isArray(classes)",classes);
    for(var class_ of classes)
    {
      var type = stridToNode(class_.name+'.'+str);
      if(type && type.$(_claimDisabled) != _true) return type;
    }
  }
  var type = node ? undefined : stridToNode('object.'+str); // last attempt
  if(!type) throw new Error('not found ("'+str+'")'+(node?' node='+node.name:'')+(classes?' classes='+classes.map(c=>c.name).join():''));
  return type;

  // var typeObject = undefined;
  // if(_.isString(str) && !str.includes('.')) str = '.'+str;
  // if(_.isString(str) && str[0] == '.' && (node||instanciable))
  // {
  //   instanciable = instanciable || node.getFromType_node(_instanceOf);
  //   if(instanciable) typeObject = stridToNode(instanciable.name+str);
  //   if(!typeObject) typeObject = stridToNode('object'+str);
  //   if(!typeObject) throw new Error('strToType() '+str+" not found on "+node.name+" instanceof "+(instanciable&&instanciable.name));
  // }
  // else typeObject = resolveIntoNode(str);
  // return typeObject;
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
  if(!i1) return Node.make();


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
      $$(claimType,_functional,_true);
      $$(claimType,_resolve,i2);
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
  





  if(!fromObject) fromObject = resolveIntoNode(i1);
  if(!fromObject) return undefined;
  if(i2 === undefined) return fromObject;

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
    if(_.isString(to)) to = resolveIntoNode(to);
    fromObject.setFromType(typeObject,to);
    return fromObject;
  }
  
  // get from type, or execute jsMethod
  if(typeObject)
  {
    // if(typeObject.getFromType_node(_typeTo) == _jsMethod)
    if(typeObject.getFromType_node(_functional) == _true)
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

      if(!toValue && typeObject != _defaultValue)
        toValue = typeObject.$(_defaultValue);

      return toValue;
      // return fromObject.getFromType_node(typeObject);
    }
  }

  return fromObject;
}


var valueToHtml = value=>
  value instanceof Node ? $$(value,'object.link')
      : value === undefined ? 'undefined'
      : value.u !== undefined ? 'undefined'
      : value.n !== undefined ? ''+value.n
      // : value.b ? (value.b?'true':'false')
      : value.s !== undefined ? '"'+value.s+'"'
      : value.j !== undefined ? '*function:l='+String(value.j).split('\n').length+'*'
      // : value.b != undefined ? (value.b?'true':'false')
      : value; // should be number


var Context = {variables:{}};
Context.resolveVariable = function(variable)
{
  return Context.variables[variable.id];
}


function instanciate(instanciable,...typeTos)
{
  var instanciableNode = resolveIntoNode(instanciable);
  if(!instanciableNode) throw new Error("unknown _instanciable"+(_.isString(instanciable)?': '+instanciable:''));
  typeTos.forEach(v=>v[0] = strToType(v[0],undefined,instanciableNode.$(_supClasses)));
  typeTos.unshift([_instanceOf,instanciableNode]);
  // console.log("instanciate()",instanciableNode.name,typeTos);
  return makeUnique(typeTos);
}
Node.instanciate = instanciate;
function makeUnique(typeTos)
{
    // console.log('makeUnique()');
  // perform intersection of all the sets of (to,type)->froms
  // typeTos.forEach(([type,to])=>
  //   console.log('makeUnique()',$$(type,'object.prettyString'),$$(to,'object.prettyString'),$$(to).getToType_froms($$(type)).map( from=> $$(from,'object.prettyString') ) ) );
  
  // TODO check *all* non-functional to fields (in particularly that they are indeed empty if not in the description)

  var [nodeTypeTos,valueTypeTos] = _.partition(typeTos, ([T,t])=> _.isString(t) || t instanceof Node);

  if(nodeTypeTos.length == 0) throw new Error("makeUnique() needs at least one value as node (other types are not indexed)");

  nodeTypeTos = nodeTypeTos.map(([type,to])=>({type:resolveIntoNode(type),to:resolveIntoNode(to)}));
  valueTypeTos = valueTypeTos.map(([type,to])=>({type:resolveIntoNode(type),to:to}));
  var toCountPerType = {};
  nodeTypeTos.forEach(o=>
  {
    if(!o.to) throw new Error("undefined 'to' given to makeUnique(). "+"type="+(o.type&&o.type.name));
    if(!o.type) throw new Error("undefined 'type' given to makeUnique(). "+"to="+(o.to&&o.to.name));
    toCountPerType[o.type.id] = (toCountPerType[o.type.id]||0)+1;
    o.count = o.to.getToType_fromsCount(o.type);
  });

  // console.log(JSON.stringify(nodeTypeTos.map(o=>o.count)));

  var nodeTypeTosByCount = _.sortBy(nodeTypeTos,({count})=>count);
  var smallestType = nodeTypeTosByCount[0].type;
  var smallestTo = nodeTypeTosByCount[0].to;
  var uniques = smallestTo.getToType_froms(smallestType);
  nodeTypeTosByCount.shift(); // get rid of the smallest type, used as base selection
  // console.log(uniques.length);

  uniques = uniques.filter(_from=>
  {
    var toCountCheckedTypes = {};
    for(var {type} of nodeTypeTosByCount)
    {
      if(toCountCheckedTypes[type.id]) continue; // just previously checked
      if(type.$('multipleValues') != _true) continue;
      if(_from.getFromType_nodes(type).length != toCountPerType[type.id])
        return false; // not the same number of two values (too little or too much)
      toCountCheckedTypes[type.id] = true;
    }
    for(var {type,to} of nodeTypeTosByCount)
      if(!to.hasFrom(type,_from)) return false;
    for(var {type,to} of valueTypeTos)
      if(!_.isEqual(_from.getFromType_to(type),to)) return false;
    return true;
  });


  // nodeTypeTosByCount.forEach(({type,to})=>
  // {
  //   if(type == smallestType) return; // already handled as basis
  //   uniques = uniques.filter(_from=> to.hasFrom(type,_from) );
  // });

  // var fromss = nodeTypeTos.map(([type,to])=>$$(to).getToType_froms($$(type)));
  // fromss = _.sortBy(fromss,froms=>froms.length);
  // // console.log('makeUnique()',fromss.map(froms=>froms.map( from=> $$(from,'object.prettyString') )));
  // var uniques = fromss[0];
  // for(var i=1;i<fromss.length && uniques.length > 0;i++)
  // {
  //   uniques = _.intersection(uniques,fromss[i]);
  //   // console.log('makeUnique()','uniques.length',uniques.length);
  // }

  // valueTypeTos.forEach(([T,t])=>
  // {
  //   uniques = uniques.filter(f=> f.$(T) == t);
  // });

    // console.log('makeUnique()','uniques.length',uniques.length,uniques.length&&$$(uniques[0],'object.prettyString'));
  // one or more found
  if(uniques.length > 0)
  {
    makeUnique.justCreated = false;
    return uniques[0];
  }

  // else create one
  var unique = Node.make();
  typeTos.forEach(([type,to])=>$$(unique,type,to));
  makeUnique.justCreated = true;
  return unique;
}




function importClaims(compactJson)
{
  var claims = [];
  if(compactJson.v != 1)
    throw new Error("unsupported compactJson version: "+compactJson.v);
  var stats = _.fill(Array(8), {});
  var lastClaimJsons = {d:0};
  var values = compactJson.values;
  for(var claimJson of compactJson.claims)
  {
    // console.log("importClaims()","claimJson",claimJson);

    if(claimJson.f === undefined) claimJson.f = lastClaimJsons.f;
    else lastClaimJsons.f = claimJson.f;
    if(claimJson.T === undefined) claimJson.T = lastClaimJsons.T;
    else lastClaimJsons.T = claimJson.T;
    if(claimJson.t === undefined) claimJson.t = lastClaimJsons.t;
    else lastClaimJsons.t = claimJson.t;
    if(claimJson.c === undefined) claimJson.c = lastClaimJsons.c;
    else lastClaimJsons.c = claimJson.c;

    claimJson.f = values[claimJson.f];
    claimJson.T = values[claimJson.T];
    claimJson.t = values[claimJson.t];
    claimJson.c = values[claimJson.c];

    claimJson.d = (claimJson.d || 0) + lastClaimJsons.d;
    lastClaimJsons.d = claimJson.d;
    // console.log("importClaims()","claimJson",claimJson);
    var claim = Claim.fromCompactJson(claimJson);
    claims.push(claim);
  }
  return claims;
}



function garbageCollect(extraGarbageCollectables=[])
{
  // var garbageCollectables = [
  //   $$('descriptorIntersection'),$$('descriptorTo'),$$('descriptorFrom'),$$('descriptorDifference'),
  //   $$('collection'),$$('descriptorFullTextSearch'),
  //   $$('accessorTo'),$$('accessorFrom'),
  //   $$('variable'),$$('uniqueBy'),$$('sort')];
  // garbageCollectables.push(...extraGarbageCollectables);
  // var keptInstanciables = $$('instanciable').$froms('object.instanceOf');
  // keptInstanciables = _.without(keptInstanciables,...garbageCollectables);
  var instanciableClaimTypes = {};
  var getClaimTypes = instanciable=>
  {
    if(instanciableClaimTypes[instanciable.id])
      return instanciableClaimTypes[instanciable.id];
    return instanciableClaimTypes[instanciable.id] = instanciable.$froms(_typeFrom)
      .filter(claimType=>claimType.$(_functional) != _true);
  }
  var saveClaimMap = {};
  var saveNodeMap = {};
  var saveNode = (node,instanciable)=>
  {
    if(!node) return;
    if(saveNodeMap[node.id]) return; // saved already
    saveNodeMap[node.id] = node;
    var classes = instanciable ? instanciable.$(_supClasses) : node.$(_classes);
    // if(classes.length <= 1) console.error ("Node with only one class",node.id,node.name,classes.map(c=>c.name).join());

    for(var class_ of classes)
    {
      var claimTypes = getClaimTypes(class_);
      for(var type of claimTypes)
      {
        var claims = node.typeTos[type.id];
        if(claims)
        for(var claim of claims)
        {
          saveClaimMap[claim.id] = claim;
          if(claim.to instanceof Node)
            saveNode(claim.to);
        }
      }
    }

    // instanciable = instanciable || node.$(_instanceOf);
    // if(!instanciable) console.error ("Node without instanciable",node.id,node.name);
    // var claimTypes = getClaimTypes(instanciable || _object);
    // for(var type of claimTypes)
    // {
    //   // var multipleValues = claimType.$(_multipleValues) == _true;
    //   var claims = node.typeTos[type.id];
    //   if(claims)
    //   for(var claim of claims)
    //   {
    //     saveClaimMap[claim.id] = claim;
    //     if(claim.to instanceof Node)
    //       saveNode(claim.to);
    //   }
    // }
  }

  // [_object,_undefined,_anything,_class,_abstractClass].forEach(node=>saveNode(node));

  // for(var instanciable of keptInstanciables)
  // {
  //    var instances = instanciable.$froms(_instanceOf);
  //   console.log("Keeping",instanciable.$('prettyString'),instances.length);
  //   for(var node of instances) saveNode(node,instanciable);
  //   // var toClaimTypes = _.concat(instanciable.$froms('claimType.typeFrom'),_object.$froms('claimType.typeFrom'))
  //   //   .filter(claimType=>claimType.$('functional') != $$('true'));
  //   // for(var claimType of toClaimTypes)
  //   //    console.log("    … ",claimType.$('prettyString'));
  // }

  _.values(_idToNodeIndex).forEach(node=>
  {
    if(node.$('isGarbageCollectable') != _true) saveNode(node);
  })

  var garbageCollected = _.values(_idToNodeIndex).filter(node=>!saveNodeMap[node.id]);
  // for(var node of garbageCollected)
  //   if(!garbageCollectables.includes(node.$(_instanceOf))) console.log("garbageCollect() Garbage collecting:",node.id,node.$('prettyString'));
  // for(var node of garbageCollected)
  //   if(node.strid) console.log("garbageCollect() Garbage collecting:",node.id,node.$('prettyString'));

  // var garbageCollectedClaims = _.values(Claim.idIndex).filter(claim=>!saveClaimMap[claim.id]);
  // var garbageCollectedClaims = Claim.mainClaimStore.getAll().filter(claim=>!saveClaimMap[claim.id]);
  var garbageCollectedClaims = [...Claim.makeOverallClaimIterator()].filter(claim=>!saveClaimMap[claim.id]);
    console.log("garbageCollect() collecting",garbageCollectedClaims.length,"out of",Claim.count,'should be left',Claim.count-garbageCollectedClaims.length);
  Claim.hideDeleteLogs = true;
  garbageCollectedClaims.forEach(claim=>Claim.remove(claim));
  delete Claim.hideDeleteLogs;

  // garbageCollected.forEach(node=>node.delete());
    console.log("garbageCollect() claims # after:",Claim.count);
}


module.exports = {ServerContext,fulltextSearch,resetFulltextSearchObject,
  randHex,valueToString,Claim,Node,makeNode,stridToNode,$$,valueToHtml,makeUnique,_idToNodeIndex,_classes,_supClasses,
  _object,_anything,_instanceOf,_instanciable,_claimType,_typeFrom,_typeTo,_jsMethod,
  ClaimStore,importClaims,
  garbageCollect,
_stridClaims,};