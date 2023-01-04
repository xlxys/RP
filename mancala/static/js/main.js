var pot_center = new Point(30,30);
var proximity_threshold = 14 * 14;
var colors = [
  new Color(255,0,0,0.7),
  new Color(0,255,0,0.7),
  new Color(0,0,255,0.7),
  new Color(255,255,0,0.7),
  new Color(0,255,255,0.7)
];
var isTopPlayer = true;

function Point(x,y)
{
  this.x = x;
  this.y = y;
  this.plus = function(p)
  {
    return new Point(
      this.x + p.x,
      this.y + p.y
    );
  }
  this.minus = function(p)
  {    
    return new Point(
      this.x - p.x,
      this.y - p.y
    );
  }
  this.normSq = function()
  {
    return x * x + y * y;
  }
}

function Color(r,g,b,a)
{
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
  this.toString = function()
  {
    return "rgba("+Math.floor(this.r)+","+Math.floor(this.g)+","+Math.floor(this.b)+","+this.a+")"
  }
  this.lerpTo = function(dest,alpha)
  {
    const acomp = 1 - alpha;
    return new Color(
      r * acomp + dest.r * alpha,
      g * acomp + dest.g * alpha,
      b * acomp + dest.b * alpha,
      a * acomp + dest.a * alpha
    );
  }
}

function Pot(id_in)
{
  if(!(
    (id_in.charAt(0) === 'p' || id_in.charAt(0) === 'm') &&
    (id_in.charAt(1) === 't' || id_in.charAt(1) === 'b') &&
    (id_in.charAt(2) >= 1    || id_in.charAt(2) <= 6 )))
  {
    throw "invalid id for pot construction";
  }
  this.id = id_in;
  this.isTop = function()
  {
    return this.id.charAt(1) === 't';
  };
  this.isBottom = function()
  {
    return !isTop();
  };
  this.isMan = function()
  {
    return this.id.charAt(0) === 'm';
  };
  this.getSide = function()
  {
    return this.id.charAt(1);
  }
  this.getOtherSide = function()
  {
    if(this.getSide() === 't')
    {
      return 'b';
    }
    else
    {
      return 't';
    }
  }
  this.getNumber = function()
  {
    return parseInt(this.id.charAt(2));
  }
  this.getOpposite = function()
  {
    if(this.isMan())
    {
      throw "cannot get opposite of mancala pot";
    }
    return new Pot("p" + this.getOtherSide() + (7-this.getNumber()));
  }
  this.getNextSown = function(isTopPlayer)
  {
    if(this.isMan())
    {
      if(this.isTop())
      {
        return new Pot("pb1");
      }
      else
      {
        return new Pot("pt1");
      }
    }
    else
    {
      if(this.getNumber() === 6)
      {
        if(isTopPlayer)
        {
          if(this.isTop())
          {
            return new Pot('mt');
          }
          else
          {
            return new Pot('pt1');
          }
        }
        else
        {
          if(this.isBottom())
          {
            return new Pot('mb');
          }
          else
          {
            return new Pot('pb1');
          }
        }
      }
      else
      {
        return new Pot('p'+this.getSide()+(this.getNumber()+1));
      }
    }    
  }
  this.$ = function()
  {
    return $('#'+this.id);
  }
}

var setbg_rgba = function(e,c)
{
  const hi = c.lerpTo(new Color(255,255,255,0),0.8);
  hi.a = 0.85;
  const lo = c.lerpTo(new Color(0,0,0,0),0.8);
  lo.a = 0.85;
  const grad =  "radial-gradient(farthest-corner at 9px 9px," +
    hi + " 0%, " + hi + " 8%, " + c + " 30%, " +
    lo + " 90%)";
  e.css("background-image",grad );
}

var read_pos = function(bead)
{
  return new Point(
    parseInt($(bead).css("left").slice(0,-2)),
    parseInt($(bead).css("top").slice(0,-2))
  );
}

var generate_pot_offset = function( radius )
{
  const theta = Math.PI * (2 * Math.random() - 1);
  const r = radius * Math.random();
  return new Point( 
    Math.floor( r * Math.cos(theta) ),
    Math.floor( r * Math.sin(theta) )
  );
}

var pos_proximity_test = function(test_pos,dest_pot,dist)
{ 
  var too_close = false;
  dest_pot.$().children().each(function(idx,bead)
  {
    const pos_bead = read_pos(bead);
    if( pos_bead.minus(test_pos).normSq() < dist )
    {
      too_close = true;
      return false;
    }
  });
  return !too_close;
}

var set_bead_pos = function(bead,pos)
{
  $(bead).css( {
    "top":pos.y + "px","left":pos.x + "px"
  } );  
}

var position_bead = function(bead,dest_pot)
{
  let dsq = proximity_threshold;
  let done = false;
  while( !done )
  {
    dsq--;
    const cand_pos = pot_center.plus( 
      generate_pot_offset( 25 )
    );
    if(pos_proximity_test(cand_pos,dest_pot,dsq))
    {
      set_bead_pos(bead,cand_pos);
      done = true;
    }    
  }
}

var move_bead = function(bead,dest_pot)
{
  position_bead(bead,dest_pot);  
  $(bead).appendTo(dest_pot.$());
}

var place_new_bead = function(id,c)
{
  const bead = $("<div>",{"class":"bead"});
  setbg_rgba(bead,c);
  const dest_pot = new Pot(id);
  position_bead(bead,dest_pot);
  dest_pot.$().append(bead);
}

var populate_row = function(row)
{
  let n = 0;
  for(let c = 0; c < 4; c++)
  {
    for(let i = 1; i <= 6; i++,n++)
    {
      place_new_bead(row + i,colors[n % colors.length]);
    }
  }
}

var string_out = function(src_pot,last_pot)
{ 
  const children = src_pot.$().children();
  if(children.length === 0)
  {
    src_pot.$().css("background-color","rgba(255, 255, 255, 0.08)");
    addPotHandlers();
    return;
  }
  if(last_pot === undefined)
  {
    last_pot = src_pot;
  }
  const el = children.get(0);
  last_pot = last_pot.getNextSown(true);
  // steal
  if(children.length == 1 &&
     isTopPlayer === last_pot.isTop() &&
     last_pot.$().children().length === 0 &&
     !last_pot.isMan())
  {
    last_pot.getOpposite().$().children().each(function(idx,el_steal)
    {
      move_bead(el_steal,new Pot('mt'));
    });    
    move_bead(el,new Pot('mt'));
  }
  else
  {
    move_bead(el,last_pot);
  }
  setTimeout(string_out,250,src_pot,last_pot)
}

var addPotHandlers = function()
{
  $(".topmid .pot")
    .mouseenter(function()
  {
    $(this).css( {
      "background-color":"rgba(255, 255, 255, 0.16)",
      "cursor":"pointer"
    }); 
  }).mouseleave(function()
  {
    $(this).css( {
      "background-color":"rgba(255, 255, 255, 0.08)",
      "cursor":"arrow"
    }); 
  }).click(function()
  {
    // check if move is valid
    $(".topmid .pot").off();
    string_out(new Pot($(this).attr("id")));
  });  
};



$(document).ready( function()
{
  addPotHandlers();
  populate_row("pt");
  populate_row("pb");
});