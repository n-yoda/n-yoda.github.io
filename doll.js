// TODO: {x: x, y: y}をgl-matrixのvec2に置き換える

// 関節
function Limb(pos, rot, size, children, tags){
    this.position = pos;
    this.rotation = rot;
    this.size = size;
    this.children = children;
    this.range = 10;
    this.tags = tags;
}

Limb.prototype.draw = function(ctx){
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -this.size);
    ctx.stroke();
};

Limb.prototype.drawRecursively = function(ctx, focus, color){
    if(focus === ""){
        ctx.strokeStyle = color || '#ff0000';
    }else{
        ctx.strokeStyle = '#000000';
    }
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    this.draw(ctx);
    for(var key in this.children){
        var focusChild = focus;
        if(focus && focus.indexOf(key) === 0){
            focusChild = focus.substr(key.length + 1);
        }
        this.children[key].drawRecursively(ctx, focusChild);
    }
    ctx.rotate(-this.rotation);
    ctx.translate(-this.position.x, -this.position.y);
};

Limb.prototype.hitTest = function(x, y){
    var r = this.range;
    if(x * x + y * y < r * r)
        return true;
    else if(x * x + (y + this.size) * (y + this.size) < r * r)
        return true;
    else if(Math.abs(x) <= r && y <= 0 && y >= -this.size)
        return true;
    else
        return false;
};

Limb.prototype.hitTestRecursively = function(x, y){
    var x2 = x - this.position.x;
    var y2 = y - this.position.y;
    var cos = Math.cos(-this.rotation);
    var sin = Math.sin(-this.rotation);
    x = cos * x2 - sin * y2;
    y = sin * x2 + cos * y2;
    for(var key in this.children){
        var result = this.children[key].hitTestRecursively(x, y);
        if(result !== null){
            return key + "/" + result;
        }
    }
    if(this.hitTest(x, y)){
        return "";
    }
    return null;
};

Limb.prototype.absolutePosition = function(path, pos, rot){
    pos = pos || {x: 0, y: 0};
    rot = rot || 0;
    var sin = Math.sin(rot);
    var cos = Math.cos(rot);
    var x = pos.x + this.position.x * cos - this.position.y * sin;
    var y = pos.y + this.position.x * sin + this.position.y * cos;
    rot = rot + this.rotation;
    if(path === ""){
        return {x: x, y: y};
    }
    for(var key in this.children){
        if(path.indexOf(key) === 0){
            return this.children[key].absolutePosition(
                path.substr(key.length + 1), {x: x, y: y}, rot);
        }
    }
    return null;
};

Limb.prototype.find = function(path){
    if(path === ""){
        return this;
    }
    for(var key in this.children){
        if(path.indexOf(key) === 0){
            return this.children[key].find(
                path.substr(key.length + 1));
        }
    }
    return null;
};

Limb.prototype.applyTags = function(tags){
    var rx = 0;
    var ry = 0;
    var cnt = 0;
    var tags2 = {};
    // ローカル座標に変換
    for(var tag in tags){
        tags2[tag] = [[0, 0], [0, 0], [0, 0], [0, 0]];
        for(var i = 0; i < 4; i++){
            tags2[tag][i][0] = tags[tag][i][0] - this.position.x;
            tags2[tag][i][1] = tags[tag][i][1] - this.position.y;
        }
    }
    // タグが1つであることを想定
    for(tag in this.tags){
        if(tag in tags2){
            var t = tags2[tag];
            var cx = (t[0][0] + t[1][0] + t[2][0] + t[3][0]) * 0.25;
            var cy = (t[0][1] + t[1][1] + t[2][1] + t[3][1]) * 0.25;
            var cv = vec2.normalize(vec2.create(), vec2.fromValues(cx, cy));
            var tx = this.tags[tag].x;
            var ty = this.tags[tag].y;
            var tv = vec2.normalize(vec2.create(), vec2.fromValues(tx, ty));
            rx += cv[0] * tv[0] + cv[1] * tv[1];
            ry += - cv[0] * tv[1] + cv[1] * tv[0];
            cnt ++;
        }
    }
    // ダメなら子を見て決める
    if(cnt > 0){
        this.rotation = Math.atan2(ry, rx);
    }else{
        var ok = false;
        for(var key in this.children){
            var childTags = this.children[key].tags;
            for(var tag in childTags){
                if(tag in tags2){
                    var t = tags2[tag];
                    var ch = childTags[tag];
                    var cx = (t[0][0] + t[1][0] + t[2][0] + t[3][0]) * 0.25;
                    var cy = (t[0][1] + t[1][1] + t[2][1] + t[3][1]) * 0.25;
                    var dx = (t[0][0] + t[1][0] - t[2][0] - t[3][0]) * 0.5;
                    var dy = (t[0][1] + t[1][1] - t[2][1] - t[3][1]) * 0.5;
                    var dir = vec2.normalize(vec2.create(), vec2.fromValues(dx, dy));
                    var chLen = Math.sqrt(ch.x * ch.x + ch.y * ch.y);
                    cx += dir[0] * chLen;
                    cy += dir[1] * chLen;
                    var cv = vec2.normalize(vec2.create(), vec2.fromValues(cx, cy));
                    var tx = this.children[key].position.x;
                    var ty = this.children[key].position.y;
                    var tv = vec2.normalize(vec2.create(), vec2.fromValues(tx, ty));
                    var ax = cv[0] * tv[0] + cv[1] * tv[1];
                    var ay = - cv[0] * tv[1] + cv[1] * tv[0];
                    this.rotation = Math.atan2(ay, ax);
                    ok = true;
                    break;
                }
            }
            if(ok)break;
        }
        if(!ok){
            return;
        }
    }
    // 子を調整
    cos = Math.cos(-this.rotation);
    sin = Math.sin(-this.rotation);
    for(var tag in tags2){
        for(var i = 0; i < 4; i++){
            var x = tags2[tag][i][0];
            var y = tags2[tag][i][1];
            tags2[tag][i][0] = cos * x - sin * y;
            tags2[tag][i][1] = sin * x + cos * y;
        }
    }
    for(var key in this.children){
        this.children[key].applyTags(tags2);
    }
};

// 頭
function Head(pos, rot, size, children, tags){
    Limb.call(this, pos, rot, size, children, tags);
}

Head.prototype = new Limb();

Head.prototype.draw = function(ctx, trans){
    ctx.beginPath();
    ctx.arc(0, -this.size / 2, this.size / 2, 0, Math.PI * 2, false);
    ctx.stroke();
};

Head.prototype.hitTest = function(x, y){
    var r = this.size / 2 + 2.5/*lineWidth*/;
    return x * x + (y + r) * (y + r) <= r * r;
};

// 体
function Body(pos, rot, size, width, children, tags){
    Limb.call(this, pos, rot, size, children, tags);
    this.width = width;
}

Body.prototype = new Limb();

Body.prototype.draw = function(ctx, trans){
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-this.width / 2, -this.size);
    ctx.lineTo(this.width / 2, -this.size);
    ctx.lineTo(0, 0);
    ctx.stroke();
};

Body.prototype.hitTest = function(x, y){
    return y <= 5 && y >= -this.size - 5 &&
        Math.abs(x) - 5 <= - y / this.size * this.width / 2;
};

Body.prototype.applyTags = function(tags){
    var mat = mat2d.create();
    var rx = 0;
    var ry = 0;
    mat[0] = 0;
    mat[3] = 0;
    var cnt = 0;
    for(var tag in this.tags){
        if(tag in tags){
            cnt++;
            var base = mat2d.create();
            var baseInv = mat2d.create();
            var trans = mat2d.create();
            var transInv = mat2d.create();
            var rot = mat2d.create();
            var base2 = mat2d.create();
            var result = mat2d.create();

            base[0] = tags[tag][1][0] - tags[tag][0][0];
            base[1] = tags[tag][1][1] - tags[tag][0][1];
            base[2] = tags[tag][3][0] - tags[tag][0][0];
            base[3] = tags[tag][3][1] - tags[tag][0][1];
            mat2d.invert(baseInv, base);

            trans[4] = -tags[tag][0][0];
            trans[5] = -tags[tag][0][1];

            transInv[4] = this.tags[tag].x + this.tags[tag].u;
            transInv[5] = this.tags[tag].y + this.tags[tag].v;

            rx += base[0];
            ry += base[1];

            base2[0] = -this.tags[tag].u * 2;
            base2[1] = 0;
            base2[2] = 0;
            base2[3] = -this.tags[tag].v * 2;

            mat2d.mul(result, transInv, mat2d.mul(
                mat2d.create(), base2, mat2d.mul(mat2d.create(),
                    rot, mat2d.mul(mat2d.create(), baseInv, trans))));

            for(var i = 0; i < 6; i ++){
                mat[i] += result[i];
            }
        }
    }
    if(cnt == 0){
        return;
    }
    for(var i = 0; i < 6; i ++){
        mat[i] /= cnt;
    }

    for(var tag in tags){
        for(i = 0; i < 4; i++){
            var v = vec2.fromValues(tags[tag][i][0], tags[tag][i][1]);
            var v2 = vec2.transformMat2d(vec2.create(), v, mat);
            tags[tag][i][0] = v2[0] + this.position.x;
            tags[tag][i][1] = v2[1] + this.position.y;
        }
    }
    window.hoge = mat;
    Limb.prototype.applyTags.call(this, tags);

    this.rotation = Math.atan2(ry, rx);
    var cos = Math.cos(this.rotation);
    var sin = Math.sin(this.rotation);
    for(var tag in tags){
        for(i = 0; i < 4; i++){
            var v = vec2.fromValues(tags[tag][i][0] - this.position.x, tags[tag][i][1] - this.position.y);
            tags[tag][i][0] = v[0] * cos - v[1] * sin + this.position.x;
            tags[tag][i][1] = v[0] * sin + v[1] * cos + this.position.y;
        }
    }
};

// 人形を作る
function makeDoll()
{
    var pi8 = Math.PI / 8;
    var long = 60, short = 50;
    var inner = 0.714;
    var tag10 = 10 * inner;
    var tag15 = 15 * inner;
    var longTag = {x: 0, y: -long/2, u: tag10, v: tag10};
    var shortTag = {x: 0, y: -short/2, u: tag10, v: tag10};
    var leftHand = new Limb({x: 0, y: -short}, -pi8, short, {}, {8: shortTag});
    var rightHand = new Limb({x: 0, y: -short}, pi8, short, {}, {11: shortTag});
    var leftFoot = new Limb({x: 0, y: -long}, -pi8, short, {}, {12: longTag});
    var rightFoot = new Limb({x: 0, y: -long}, pi8, short, {}, {15: longTag});
    var limbs = {
        head: new Head({x: 0, y: -90}, 0, 30, {}, {7: {x: 0, y: -20, u: -tag10, v: -tag10}}),
        leftArm: new Limb({x: -30, y: -80}, -pi8 * 7, short, {leftHand: leftHand}, {9: shortTag}),
        rightArm: new Limb({x: 30, y: -80}, pi8 * 7, short, {rightHand: rightHand}, {10: shortTag}),
        leftLeg: new Limb({x: 0, y: 0}, -pi8 * 7, long, {leftFoot: leftFoot}, {13: longTag}),
        rightLeg: new Limb({x: 0, y: 0}, pi8 * 7, long, {rightFoot: rightFoot}, {14: longTag})
    };
    var bodyTags = {
        0: {x: -115, y: -115, u: -tag15, v: -tag15},
        1: {x: -115, y: 0, u: -tag15, v: -tag15},
        2: {x: -115, y: 115, u: -tag15, v: -tag15},
        3: {x: 0, y: 115, u: -tag15, v: -tag15},
        4: {x: 115, y: 115, u: -tag15, v: -tag15},
        5: {x: 115, y: 0, u: -tag15, v: -tag15},
        6: {x: 115, y: -115, u: -tag15, v: -tag15}
    };
    return new Body({x: 200, y: 200}, 0, 80, 60, limbs, bodyTags);
}
