var doll;

$(function(){
    var main = document.getElementById('main');
    var context = main.getContext('2d');
    var camera = document.getElementById('camera');
    var cameraCtx = camera.getContext('2d');
    var video = document.getElementById('video');
    var streaming = false;

    // メインコンテクストの設定
    context.lineCap = 'round';
    context.lineWidth = 5;
    context.clear = function(){
        this.clearRect(0, 0, main.width, main.height);
    };

    // マウスイベント
    var dragging = false;
    var rotating = false;
    var hit;
    var firstMouse, pivot;
    var firstDollX, firstDollY, firstDollRot;
    var capturing = false;

    var getPosition = function(elem, e){
        var off = $(elem).offset();
        var x = e.pageX - off.left;
        var y = e.pageY - off.top;
        return {x: x, y: y};
    };

    var getRotation = function(elem, e){
        var p = getPosition(elem, e);
        return Math.atan2(p.x - doll.position.x, doll.position.y - p.y);
    };

    $(main).mousedown(function(e){
        if(e.button !== 0 || capturing){
            return;
        }
        var pos = getPosition(this, e);
        if(hit !== null){
            rotating = true;
            pivot = doll.absolutePosition(hit);
        }else{
            dragging = true;
        }
        firstMouse = getPosition(this, e);
        firstDollX = doll.position.x;
        firstDollY = doll.position.y;
        if(hit !== null)firstDollRot = doll.find(hit).rotation;
    });

    $(main).mousemove(function(e){
        var pos = getPosition(this, e);
        context.clear();
        if(rotating){
            var fst = Math.atan2(firstMouse.y - pivot.y, firstMouse.x - pivot.x);
            var now = Math.atan2(pos.y - pivot.y, pos.x - pivot.x);
            doll.find(hit).rotation = firstDollRot + now - fst;
            resetSliders();
        }else if(dragging){
            doll.position.x = firstDollX + pos.x - firstMouse.x;
            doll.position.y = firstDollY + pos.y - firstMouse.y;
            resetSliders();
        }else if(!capturing){
            hit = doll.hitTestRecursively(pos.x, pos.y);
        }
        doll.drawRecursively(context, hit);
    });

    $('body').mouseup(function(e){
        dragging = false;
        rotating = false;
        context.clear();
        doll.drawRecursively(context);
    });

    // スライダー
    var idToLimb = function(sliderId){
        if(sliderId === "body")
            return doll;
        else
            return doll.find(sliderId);
    };

    var resetSliders = function(){
        $('.slider').each(function(){
            var limb = idToLimb(this.id);
            var rot = limb.rotation % (Math.PI * 2);
            if(rot > Math.PI)
                rot -= Math.PI * 2;
            if(rot < - Math.PI)
                rot += Math.PI * 2;
            this.value = rot / Math.PI * 180;
        });
    };

    $('.slider').each(function(){
        this.oninput = function(){
            var limb = idToLimb(this.id);
            limb.rotation = this.value * Math.PI / 180;
            context.clear();
            doll.drawRecursively(context);
        };
    });
    
    // リセット
    var reset = function(){
        $('#sample').attr('src', practice);
        doll = makeDoll();
        context.clear();
        doll.drawRecursively(context);
        resetSliders();
    };
    $('#reset').click(reset);
    reset();
    
    // ユーザーテスト
    var tests = [
        "http://www-ui.is.s.u-tokyo.ac.jp/~takeo/course/2014/ui/fig0.png",
        "http://www-ui.is.s.u-tokyo.ac.jp/~takeo/course/2014/ui/fig1.png",
        "http://www-ui.is.s.u-tokyo.ac.jp/~takeo/course/2014/ui/fig2.png"
    ];
    var practice = "http://www-ui.is.s.u-tokyo.ac.jp/~takeo/course/2014/ui/practice.png";

    var testId = -1;
    var testTimer;
    
    var userTest = function(){
        $("#time").val($("#time").val() * 1 + 1);
    };

    $('.test').each(function(i, elem){
        $(elem).click(function(){
            reset();
            $('#sample').attr('src', tests[i]);
            $("#time").val(0);
            testId = i;
            testTimer = setInterval(userTest, 1000);
            $('#reset').attr('disabled', 'disabled');
            $('.test').attr('disabled', 'disabled');
        });
    });
    
    $('#done').click(function(){
        if(testId >= 0){
            $('.test').removeAttr('disabled');
            $('#reset').removeAttr('disabled');
            clearInterval(testTimer);
            $('#test-id').val(testId);
            $('#test-time').val($('#time').val());
        }
    });

    // URLパラメータから復元
    var getParam = function(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
        return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    if(getParam('send') === 'send'){
        $('.slider').each(function(i, elem){
            var limb = idToLimb(this.id);
            this.value = getParam(this.id);
            limb.rotation = this.value * Math.PI / 180;
        });
        context.clear();
        doll.drawRecursively(context);
        $('#pre-test-id').val(getParam('test-id'));
        $('#pre-test-time').val(getParam('test-time'));
        $('#sample').attr('src', tests[getParam('test-id') * 1]);
    }
    

    // WebCamera
    navigator.getMedia = (
       navigator.getUserMedia || navigator.webkitGetUserMedia ||
       navigator.mozGetUserMedia || navigator.msGetUserMedia);

    navigator.getMedia(
        {video: true, audio: false},
        function(stream) {
            if (navigator.mozGetUserMedia) {
                video.mozSrcObject = stream;
            } else {
                var vendorURL = window.URL || window.webkitURL;
                video.src = vendorURL.createObjectURL(stream);
            }
            video.play();
        },
        function(err){alert(err);}
    );

    video.addEventListener('canplay', function(ev){
        if (!streaming) {
            var width = video.getAttribute('width');
            var height = video.videoHeight / (video.videoWidth/width);
            video.setAttribute('height', height);
            camera.setAttribute('height', height);
            streaming = true;
        }
    }, false);

    // 認識
    var chilitagsTimer = false;
    var updateChilitags = function() {
        if (streaming) {
            cameraCtx.drawImage(video, 0, 0, video.width, video.height);
            var tags = Chilitags.find(camera, true);
            var color = 'rgb(255, 0, 192)';
            //Draw lines
            cameraCtx.lineWidth = 3;
            cameraCtx.strokeStyle = color;
            for(var tag in tags){
                cameraCtx.beginPath();
                cameraCtx.moveTo(tags[tag][0][0], tags[tag][0][1]);
                cameraCtx.lineTo(tags[tag][1][0], tags[tag][1][1]); 
                cameraCtx.lineTo(tags[tag][2][0], tags[tag][2][1]); 
                cameraCtx.lineTo(tags[tag][3][0], tags[tag][3][1]);
                cameraCtx.closePath();
                cameraCtx.stroke(); 
            }
            cameraCtx.setTransform(-1, 0, 0, 1, video.width, 0);
            cameraCtx.drawImage(camera, 0, 0, video.width, video.height);
            cameraCtx.setTransform(1, 0, 0, 1, 0, 0);

            if(capturing){
                var bk = {lw: context.lineWidth, ss: context.strokeStyle};
                doll.applyTags(tags);
                resetSliders();
                context.clear();
                doll.drawRecursively(context);
                context.lineWidth = 2;
                context.strokeStyle = color;
                for(var tag in tags){
                    context.beginPath();
                    context.moveTo(tags[tag][0][0], tags[tag][0][1]);
                    context.lineTo(tags[tag][1][0], tags[tag][1][1]); 
                    context.lineTo(tags[tag][2][0], tags[tag][2][1]); 
                    context.lineTo(tags[tag][3][0], tags[tag][3][1]);
                    context.closePath();
                    context.stroke(); 
                }
                context.lineWidth = bk.lw;
                context.strokeStyle = bk.ss;
            }else{
                cameraCtx.globalAlpha = 0.3;
                cameraCtx.fillStyle = '#000';
                cameraCtx.fillRect(0, 0, camera.width, camera.height);
                cameraCtx.globalAlpha = 1;
                cameraCtx.fillStyle = color;
                cameraCtx.font = "bold 70px Arial";
                cameraCtx.textAlign = "center";
                cameraCtx.fillText("Press space key!", camera.width / 2, camera.height / 2);
            }
        }
    };

    $('body').keypress(function(e){
        if(e.keyCode == 32){
            e.preventDefault();
            capturing = !capturing;
            context.clear();
            doll.drawRecursively(context);
        }
    });

    setInterval(updateChilitags, 30)
});

