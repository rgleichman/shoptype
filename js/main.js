var items = Array();
var food = Array();
var charsTyped = Array();
var state = 0; //0=playing, 1=gameOver, 2=adding to cart disabled (in between rounds)
var debugging = false;
var numItemsOffList = 0;
var totalBonus = 0;
var roundNum = 0;
var firstEnter = true;
var testSettings = false;
var dump = "";
var cart = {
    numItems: 0,
    addTime: 500
}

var allFood = [["bread","cat food","green tea","medicine","milk"]
	       ,["broccoli"," cat","rice","tooth paste","vegetables"]
	       ,["cookies","fish"," miau","salsa","spicy"]
	       ,["$1","$5","$10","$20","$50","$100"]
	      ]

var gameVars = new function() {
    this.speed = .5;
    this.firstRoundTime = 40;
    this.roundTime=  this.firstRoundTime/this.speed;
    this.itemsPerRound =  4;
    this.numItemsNeeded = 16;
}
//testing
if(testSettings){
    gameVars.firstRoundTime = 5;
    gameVars.roundTime = gameVars.firstRoundTime/gameVars.speed;
    gameVars.itemsPerRound = 1;
    gameVars.numItemsNeeded = 3;
}

function makeTimer(){
    this.beginTime = Date.now(),
    this.restart = function() {
    this.beginTime = Date.now();
    },
    this.elapsedTime = function() {
        return Date.now() - this.beginTime;
    },
    this.elapsedSeconds = function() {
       return this.elapsedTime()/1000;
    }
}

var timer = new makeTimer();
var roundTimer = new makeTimer();
var logInfo = function(){
    var obj = this;
    this.totalCharsTyped = 0;
    this.errorsPerSecond = function(){return this.errors / timer.elapsedSeconds();} ;
    this.errors = 0;
    this.wordsPerSecond = function(){return numItemsOffList /timer.elapsedSeconds();};
    this.duration = function(){return roundTimer.elapsedSeconds()};
    this.username = window.localStorage.getItem("shoptype-user");
    this.submitLog = function() {
        var str = "?start=" + timer.beginTime + "&round=" + roundNum
        + "&duration=" + timer.elapsedTime() + "&mistakes=" + obj.errors            
        + "&username=" + obj.username + "&dump=" + dump;
        // $.ajax({
        //     url: '../log/' + str,
        //     success: function(response) {
        //         if (response != 1) {
        //             console.log("Error: could not log gameplay")
        //         }
        //     }
        // })
    }
}

var logger = new logInfo();

var soundPlayer = new function(){
    this.bell = 0;
    this.s0 = new Audio("soundz/bell-0.ogg");
    this.s1 = new Audio("soundz/bell-1.ogg");
    this.s2 = new Audio("soundz/bell-1.ogg");
    this.playBell = function() {
/*	var sound = new Audio("soundz/bell-"+Math.floor(Math.random()*3)+".ogg");
	

	var s2 = new Audio("soundz/bell-"+Math.floor(Math.random()*3)+".ogg");
	sound.play();
	s2.play();
*/
	this["s"+Math.floor(Math.random()*3)].play();
	this["s"+Math.floor(Math.random()*3)].play();
//	this["s"+Math.floor(this.bell+1)%3].play();
	
	this.bell++;
    }
}

function changeWordState(wordState){
    var s = ['badWord', 'correctWord', 'normalWord'];
    for(i in s){
	$('#shelves').removeClass(s[i]);
	$('#footer').removeClass(s[i]);
    }
    $('#shelves').addClass(wordState);
    $('#footer').addClass(wordState);
}
    
function setup() {
    /*if ($('#username input').val().length < 3) {
        alert("Please enter a username. Must be at least 4 characters.");
        $('#username input').focus();
        return false;
    } else {*/
    window.localStorage.setItem("shoptype-user", $('#username input').val());
    logger.username = $('#username input').val();
    //}
    var food = Array();
//    loadItems();
    // $(document).keypress(function(e){
    //     keyAction(e);
    // })
    $('#cart').addClass('animating');
    $('#start').fadeOut();
    $('#textArea').text("");
    $('#wordBox').addClass('visible');

    $('#textArea').focus();
    $(document).click(function(){
        $('#textArea').focus();
    });
    //new change (seems to make it red after pressing enter)
//    $('#textArea').keyup(function(){ 
//	if (state === 0) { window.setTimeout(function() { typedFoods() }, 0) } 
//    });
    $('#textArea').keyup(typedFoods);
    //$('#textArea').keyup(checkEnterPressed);
    $(document).keyup(checkEnterPressed);
    changeWordState('normalWord');
    timer.restart();  
    roundTimer.restart();
    updateTime();
    window.setInterval("updateTime()", 1000);
    //play sound
    $('#s_door').get(0).play();
    startRound(true);
//    updateBonusBox(0);
//    checkEndOfRound();
}
function startRound(goFaster){

    if (roundNum != 0) {
        logger.submitLog();
    }
    state = 0;
    $('#cart').removeClass('invisible');

    if(goFaster){
	$('#s_allright').get(0).play();
	var bonus = Math.round(gameVars.firstRoundTime - timer.elapsedSeconds());
	roundNum++;
	roundTimer.restart();
	if(bonus > 0){
            totalBonus += bonus;
	    //        updateBonusBox(totalBonus);
	}
    gameVars.roundTime *= gameVars.speed;
    $('#textArea').val('');
    }
    else{
	$('#s_miau').get(0).play();
	$('#round_msg').addClass('visible');
	setTimeout("$('#round_msg').removeClass('visible')", 3000);
    numItemsOffList -= cart.numItems;
    gameVars.roundTime /= gameVars.speed;
    
    }
    loadItems();
    if(food == undefined || food.length === 0){
        return gameOver();
    }
    dump = "";
    cart.numItems = 0;
    updateItemsNeededBox();
    $('body').attr("class", "round-"+roundNum);
    $('#cart').clearQueue();
    $('#cart').css({right: '0%'});
    var currentRoundNum = roundNum;
    $('#cart').animate({right: '100%'}, 1000*gameVars.roundTime, 'linear', 
               function(){if(currentRoundNum === roundNum && (state === 0)){
               state = 2;
               $('#cart').addClass('invisible');
               setTimeout("startRound(false)", cart.addTime + 50)}});
//    timer.restart();
    //New: also used to remove shelf color when round changes
    typedFoods();
}    
    /* -web -webkit-transition: .5s;*/
function loadItems() {
    $('#cart_sub').html('');
    var buffer = "";
    food = allFood[roundNum - 1];
    food = shuffle(food);
    for(f in food){
	    buffer += '<div class="item" name="' + food[f] + '"><img src="images/food/round-' + roundNum + '/' +food[f]+'.png" name="' + food[f] + '" height="110" /></div>';
    }

    $('#shelf-0').html(buffer);
    $('.shelf [name=" miau"]').addClass('miau');
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

//function keyAction(e) {
/*    if(state == 0){
    typedFoods(String.fromCharCode(e.which).toLowerCase());
    }
*/
//}

function stringFromCharArray(arr){
    var rtnString = "";
    for(ch in arr){
    rtnString += arr[ch];
    }
    return rtnString;
}

//returns an array of all of the foods that have been typed so far
function typedFoods(letter){
//    updateBonusBox();
//    charsTyped.push(letter);
    if(state !== 0){
	return;
    }
    var trimmed = $('#textArea').val().trim();
    if(trimmed == ''){
	$('#textArea').val(trimmed);
    }
    if(state === 2){
	return;
    }
    
    if(letter && letter.which === 13){
	return;
    }
    //New: remove newline so that if enter is pressed it stays green
    charsTyped = $('#textArea').val().replace(/(\r\n|\n|\r)/gm,"");
    var validFoods = Array();
    function selectFood(){
	for (i in validFoods) {
            $('.shelf .item[name="' + validFoods[i] + '"]').addClass('selected');
	}
    }

    changeWordState('normalWord');
//    $('#wordBox').html(stringFromCharArray(charsTyped));

    for(f in food){
        var good = true;
        for(ch in charsTyped){
            if(charsTyped[ch].toLowerCase() != food[f].charAt(ch)){
                good = false;
            }
        }
        if (good == true){
	   
            validFoods.push(food[f]);

            //the entire word has been typed correctly
            if(charsTyped.length == food[f].length) {
		changeWordState('correctWord');
		selectFood();
		logger.totalCharsTyped += charsTyped.length;
                charsTyped = Array();
                return validFoods;
            }
        }
    }
    $('.shelf .item').removeClass('selected');

    selectFood();
    //The character was incorrect
    if(validFoods.length == 0){
/*        $('body').addClass('error');
        setTimeout(function(){
            $('body').removeClass('error'); 
        }, 300)*/
	$('#s_buzz').get(0).play();
	logger.errors++;
	changeWordState('badWord');
	charsTyped = Array();
    }
    else{
//    $('#footer').removeClass('badWord');
    }
    if(debugging){
        alert(validFoods);
    }
    return validFoods;
}

function checkEnterPressed(e) {
    if (e.which == 13) {
        pressEnter();
    }
}

function pressEnter() {
    //reload if in game over
    if(state === 1){
	window.location.reload();
	return;
    }
    
    var textVal = $('#textArea').val();
    //remove enter
    textVal = textVal.substring(0, textVal.length -1);
    $('#textArea').val(textVal);
    if(state === 0) {
    for (f in food) {
        if (food[f] == textVal.toLowerCase()) {
	    /*
	      var ping = $('#s_ping').get(0);
	    ping.volume = 1;
	    ping.play();
	    */
	    soundPlayer.playBell();
            numItemsOffList++;
            cart.numItems++;

            if(numItemsOffList >= gameVars.numItemsNeeded){
                return gameOver();
            } else {
                if (cart.numItems >= gameVars.itemsPerRound) {
                    state = 2;
                }    
                addToCart($('.item[name="' + food[f] + '"]'));
            }
            updateItemsNeededBox();
            $('#textArea').val("");
            
            return;
        }
    }
	if(!firstEnter){
    $('#s_buzz').get(0).play();
	}
	else{
	    firstEnter = true;
	}
    }
}
    
$(document).ready(function() {
})

function updateItemsNeededBox(){
    $('#itemsNeededBox').html("Items left on list : " + (gameVars.numItemsNeeded - numItemsOffList));
}

/*function updateBonusBox(bonus){
//    $('#bonusBox').html("Time bonus : " + bonus);
    $('#bonusBox').html("Time : " + Math.round(timer.elapsedSeconds()));
}*/
function updateTime(){
    $('#bonusBox').html("Time : " + Math.round(timer.elapsedSeconds()));
}

function addToCart(item) {
    var tmpPos = item.offset();
    var cartPos = $('#cart').offset();

    //$('#itemsNeededBox').html("Items left on list : " + (gameVars.numItemsNeeded - numItemsOffList));


    $('#animations').append(item);


    //
    food = food.filter(function(element) {
        return element != item.attr('name');
    });
     
    item.addClass('animating').css({
        top: tmpPos.top,
        left: tmpPos.left
    }).animate({
        top: cartPos.top,
        left: cartPos.left,
    height: 60,
    }, cart.addTime, function(){
    item.remove();
    $('#cart_sub').prepend(item.html());
	//New: this call removes the red banner when food is added
	typedFoods();
    if (cart.numItems >= gameVars.itemsPerRound) {
        return startRound(true);
    }
    });
    $('.shelf .item').removeClass('selected');
//    item.animate({height: 10}, cart.addTime);
    //    item.remove();
}

function gameOver() {
    //$('#s_clapping').get(0).play();
    function clap() {
	new Audio("soundz/clapping.ogg").play();
	//var sound = new Audio("soundz/clap.ogg");
	//sound.volume = Math.random();
	//sound.play();
    }
//    $('#s_allright').get(0).play();
    	$('#s_miau').get(0).play();
      for(var i= 0; i < 2000; i+=200){
	setTimeout(clap, i+Math.random()*10);
    }
    //New
    //state = 1;
    updateItemsNeededBox();
    $('#congrats').html("Congratulations " + logger.username + ", you got " + Math.round(60*gameVars.numItemsNeeded / timer.elapsedSeconds()) + " items per minute and you typed "+ Math.round(60*logger.totalCharsTyped / timer.elapsedSeconds())+ " letters per minute!");
    $('#wordBox').removeClass('visible');
    $('#cart').stop().clearQueue();
    $('#cart').removeClass('animating').animate({
        right: window.innerWidth/2
    })
    $('#game_over').fadeIn();
    state = 1;
}

$(document).ready(function() {
    $('#username input').val(window.localStorage.getItem('shoptype-user'))
    $('.item').click(function() {
        addToCart($(this));
    })
    $('#play_new').click(function() {
        setup()
        return false;
    })
    $(document).keydown(function(e) {
        dump += " " + e.which;
        if (e.which == 13 && roundNum == 0) {
            setup()
            return false;
        }
    })
    $('#doormat').click(function() {
        setup();
    })
    $('#doors').mouseenter(function() { $('#s_door').get(0).play();});
})

