
let c = document.getElementsByTagName('canvas')[0];
c.style.position = 'absolute';
c.style.top = 0;
c.style.left = 0;

window.onresize = (r = () => {
  c.width = document.body.scrollWidth;
  c.height = document.body.scrollHeight;
}, r(), r);

let ctx = c.getContext('2d');

let cells = random(1);
let MAX_SIZE = 256;
let FADE_OUT = 0.5; // 1 = immediately, 0 = never

c.addEventListener('click', (e) => {
  let T = 8;
  let t = 0;
  let [w, h] = [cells[0].length, cells.length];
  let [xc, yc] = [e.offsetX, e.offsetY];
  let [xs, ys] = [document.body.scrollWidth, document.body.scrollHeight];
  let cellSize = Math.min(xs/w, ys/h);
  let [xp, yp] = [(xs/w-cellSize)*w, (ys/h-cellSize)*h];

  console.log(xc, xc-xp, xs, xs-xp*2);
  let [x, y] = [(xc-xp*.5)/(xs-xp)*w, (yc-yp*.5)/(ys-yp)*h].map((i, j) => Math.min(Math.max(Math.floor(i), 0), [w, h][j]-1));

  let spread = 5;
  for (let yl = -spread; yl <= spread; ++yl) {
    if (cells[y+yl]) {
      for (let xl = -spread; xl <= spread; ++xl) {
        if (typeof cells[y+yl][x+xl] !== 'undefined') cells[y+yl][x+xl] = Math.random() > .5 ? 1 : 0; 
      }
    }
  }

  (function loop() {
    ctx.fillStyle = `rgba(255, 255, 0, ${1-t/T})`;
    ctx.beginPath();
    ctx.arc(xc, yc, Math.pow(t/T, 0.5) * 200, 0, Math.PI*2);
    ctx.fill();
    if (t++ < T) requestAnimationFrame(loop);
  }());

  // reset();
});

(function loop() {
  draw(ctx, cells);
  cells = nextGen(cells);

  let empty = cells.length === 0 || cells[0].length === 0;
  let big = cells.length > MAX_SIZE || (cells[0] && cells[0].length > MAX_SIZE || 0);
  if (empty || big) {
    reset();
  }
  requestAnimationFrame(loop);
}());

function reset() {
  cells = random(0.5);
}

function draw(ctx, cells) {
  let [h, w] = [cells.length, cells[0].length];
  let [ch, cw] = [ctx.canvas.height, ctx.canvas.width];
  let sq = Math.min(ch / h, cw / w);
  let [xd, yd] = [(cw / w - sq) * w * 0.5, (ch / h - sq) * h * 0.5];

  ctx.fillStyle = `rgba(0, 0, 0, ${FADE_OUT})`;
  ctx.fillRect(0, 0, cw, ch);

  ctx.fillStyle = 'rgb(63, 255, 0)';
  for (let i = 0; i < h; ++i) {
    for (let j = 0; j < w; ++j) {
      if (cells[i][j]) {
        ctx.fillRect(xd + j * sq, yd + i * sq, sq, sq);
      }
    }
  }
}

function random(fill = 0.5) {
  let [h, w] = [Math.random() * 10 + 25 | 0, Math.random() * 10 + 25 | 0];
  let r = [];
  for (let i = 0; i < h; ++i) {
    r[i] = [];
    for (let j = 0; j < w; ++j) {
      r[i][j] = Math.random() < fill ? 1 : 0;
    }
  }
  return r;
}

function nextGen(cells) {
  let h = cells.length;
  let w = cells[0].length;
  let m = [];
  let ne = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];
  for (let y = 0; y < h + 2; ++y) {
    m[y] = [];
    for (let x = 0; x < w + 2; ++x) {
      m[y][x] = 0;
      for (let n = 0; n < ne.length; ++n) {
        let row = cells[y - 1 + ne[n][1]];
        if (row) {
          m[y][x] += row[x - 1 + ne[n][0]] || 0;
        }
      }

      if (m[y][x] === 3) {
        m[y][x] = 1;
      } else {
        if (m[y][x] === 2) {
          let c = cells[y - 1] && cells[y - 1][x - 1] || 0;
          m[y][x] = c ? 1 : 0;
        } else {
          m[y][x] = 0;
        }
      }
    }
  }

  // remove rows:
  h = m.length;
  w = m[0].length;
  let rc = [];
  for (let y = 0; y < h; ++y) {
    rc[y] = 0;
    for (let x = 0; x < w; ++x) {
      if (m[y][x]) {
        rc[y] = 1;
        break;
      }
    }
  }
  let [fr, lr] = [rc.indexOf(1), rc.lastIndexOf(1)];
  if (fr !== -1) {
    m.splice(lr + 1);
    m.splice(0, fr);
  } else {
    m = [];
  }

  // remove cols:
  h = m.length;
  let cc = [];
  for (let x = 0; x < w; ++x) {
    cc[x] = 0;
    for (let y = 0; y < h; ++y) {
      cc[x] += m[y][x];
      if (cc[x]) break;
    }
  }
  let [fc, lc] = [cc.indexOf(1), cc.lastIndexOf(1)];
  if (fc !== -1) {
    for (let y = 0; y < h; ++y) {
      let nc = []
      for (let x = fc; x <= lc; ++x) {
        nc[x - fc] = m[y][x];
      }
      m[y] = nc;
    }
  } else {
    m = [];
  }

  return m;
}
