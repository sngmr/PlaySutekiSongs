var STK = {};

STK.PLAYMODE_NORMAL = 0;
STK.PLAYMODE_RANDOM = 1;
STK.PLAYMODE_ONLYLIKE = 2;

STK.player = null;
STK.latch = 0;
STK.userId = null;
STK.alreadyCheckCommentLike = false;
STK.playMode = 0;

STK.videoList;
STK.videoIndex;
STK.workVideoIndexList;

STK.login = function() {
    FB.getLoginStatus(function(response) {
        if (response.status === 'connected') {
        	STK.userId = response.authResponse.userID;
        	STK.ready();
        } else {
            FB.login(function(response) {
                if (response.authResponse) {
                	STK.userId = response.authResponse.userID;
                	STK.ready();
                } else {
                    alert("Oops!! You need to login to Facebook, bro!!");
                }
            }, {scope: 'user_groups'});
        }
    });
}

STK.ready = function() {
	if (++STK.latch >= 2) {
		STK.start();
	}
}

STK.start = function() {
	STK.videoList = [];
	STK.videoIndex = 0;
	
	STK.loadVideoList(function() {
		if (!STK.videoList || STK.videoList.length === 0) {
			alert('Oops!! There is NO video available!!');
			return;
		}
		
		// Let's roll
		$('#video_control_container').animate({ opacity: 1 }, 1000);
		$('#play_list_container').animate({ opacity: 1 }, 1000);
		$('#go_suteki').animate({ opacity: 1 }, 1000);
		STK.play();
	});
}

STK.loadVideoList = function(callback) {
	FB.api('/331943460187050/feed?limit=250', function(response) {
		var feeds = response.data;
		if (!feeds) {
			alert('Oops!! Something wrong data is coming from Facebook!!');
			return;
		}
		
		var regYoutube = /(?:youtube\.com|youtu\.be).*(?:\/|v=)([0-9a-zA-Z-_]{11})/;
		var getYoutubeData = function(data) {
			var matches = null;
			if (data.type === 'video') {
				matches = data.source.match(regYoutube);
			} else if (data.type === 'link') {
				matches = data.link.match(regYoutube);
			} else {
				matches = data.message.match(regYoutube);
			}
			
			if (matches !== null) {
				var isYouLike = false;
				if (data.from.id === STK.userId) {
					isYouLike = true;
				} else {
					if (data.likes && data.likes.count) {
						for (var i = 0, len = data.likes.data.length; i < len; i++) {
							if (data.likes.data[i].id === STK.userId) {
								isYouLike = true;
								break;
							}
						}
					}
				}
				
				return {
					id: data.id,
					youtubeId: matches[1],
					name: data.name || '　',
					message: data.message.length > 180 ? data.message.substring(0, 180) + '...' : data.message,
					from: {
						id: data.from.id,
						name: data.from.name,
					},
					isComment: false,
					isError: false,
					isYouLike: isYouLike
				};
			} else {
				return null;
			}
		}
		
		var videoList = [];
		var youtubeData;
		for (var i = 0, ilen = feeds.length; i < ilen; i++) {
			// Get Youtube video id
			youtubeData = getYoutubeData(feeds[i]);
			if (youtubeData) {
				videoList.push(youtubeData);
			}
			
			// Search comments as well
			if (feeds[i].comments && feeds[i].comments.count > 0) {
				for (var j = 0, jlen = feeds[i].comments.data.length; j < jlen; j++) {
					youtubeData = getYoutubeData(feeds[i].comments.data[j]);
					if (youtubeData) {
						youtubeData.isComment = true;	// Mark as comment
						videoList.push(youtubeData);
					}
				}
			}
		}
		
		// Create list
		var emt, tr, td1, td2, img, span, rowAddClass;
		for (var i = 0, len = videoList.length; i < len; i++) {
			if (videoList[i].isComment) {
				rowAddClass = 'comment';
			} else {
				rowAddClass = 'feed';
			}
			
			tr = $('<tr></tr>').attr('id', 'video_' + (STK.videoList.length + i))
				.addClass('play_list_row ' + rowAddClass).click(STK.jump);
			
			td1 = $('<td></td>').addClass('user_image');
			img = $('<img />')
				.attr('src', 'https://graph.facebook.com/' + videoList[i].from.id + '/picture?type=normal');
			td1.append(img);
			
			td2 = $('<td></td>').attr('id', 'msg_' + (STK.videoList.length + i))
				.addClass('message').text(videoList[i].message);
			
			tr.append(td1).append(td2);
			$("#play_list").append(tr);
		}
		
		// Execute callback
		STK.videoList = STK.videoList.concat(videoList);
		if (callback && typeof callback === 'function') {
			callback();
		}
	});	
}

STK.editScreen = function() {
	$("tr.play_list_row").each(function() {
		$(this).removeClass('selected');
	});
	
	var containerOffset = $("#play_list_container").offset().top;
	var rowOffset = $("#video_" + STK.videoIndex).offset().top;
	var scroll = rowOffset - containerOffset - 75;	// -75 is just guessing :P
	$("#play_list_container").animate({ scrollTop: '+=' + scroll + 'px' }, 'slow');

	$("#video_" + STK.videoIndex).addClass('selected');	
	$('#video_title').text(STK.videoList[STK.videoIndex].name);
}

STK.togglePlayMode = function() {
	// mode order is NORMAL(-)=>RANDOM(success)=>ONLY YOU LIKE(notice)
	var btn = $('#mode');
	
	if (btn.hasClass('notice')) {
		btn.removeClass('notice');
		btn.text('NORMAL');
		STK.playMode = STK.PLAYMODE_NORMAL;
	} else if (btn.hasClass('success')) {
		btn.removeClass('success');
		btn.addClass('notice');
		btn.text('ONLY YOU LIKE');
		STK.playMode = STK.PLAYMODE_ONLYLIKE;
	} else {
		btn.addClass('success');
		btn.text('RANDOM');
		STK.playMode = STK.PLAYMODE_RANDOM;
	}
	
	$("tr.play_list_row").each(function() {
		STK.editRowPlayLikes(this);
	});
	
	if (STK.playMode === STK.PLAYMODE_ONLYLIKE && !STK.alreadyCheckCommentLike) {
		STK.alreadyCheckCommentLike = true;
		STK.startGetCommentsLike();
	}
}

STK.editRowPlayLikes = function(row) {
	$(row).removeClass('disable');
	if (STK.playMode === STK.PLAYMODE_ONLYLIKE) {
		var index = (row.id.replace('video_', '') - 0);
		if (!STK.videoList[index].isYouLike) {
			$(row).addClass('disable');
		}
	}
}

STK.startGetCommentsLike = function() {
	STK.workVideoIndexList = [];
	for (var i = 0, len = STK.videoList.length; i < len; i++) {
		if (STK.videoList[i].isComment) {
			STK.workVideoIndexList.push(i);
		}
	}
	if (STK.workVideoIndexList.length > 0) {
		STK.getCommentsLike();
	}
}

STK.getCommentsLike = function() {
	if (STK.workVideoIndexList.length === 0) {
		STK.alreadyCheckCommentLike = true;
		
		// Warn if user dosen't have any like and post
		var gotcha = false;
		for (var i = 0, len = STK.videoList.length; i < len; i++) {
			if (STK.videoList[i].isYouLike) {
				gotcha = true;
				break;
			}
		}
		if (!gotcha) {
			alert("Ooops!! You don't have any like and posted by you. Go back to normal mode.");
			STK.togglePlayMode();
		}
		return;
	}
	
	var targetIndex = STK.workVideoIndexList.shift();
	FB.api('/' + STK.videoList[targetIndex].id, function(response) {
		if (response && response.user_likes === true) {
			STK.videoList[targetIndex].isYouLike = true;
			STK.editRowPlayLikes(document.getElementById('video_' + targetIndex));
		}
		setTimeout(STK.getCommentsLike, 500);
	});
}

STK.play = function() {
	STK.player.loadVideoById(STK.videoList[STK.videoIndex].youtubeId);
	STK.editScreen();
}
STK.next = function() {
	if (STK.playMode === STK.PLAYMODE_RANDOM) {
		STK.videoIndex = Math.floor(Math.random() * STK.videoList.length);
	} else if (STK.videoIndex >= STK.videoList.length - 1) {
		STK.videoIndex = 0;
	} else {
		STK.videoIndex++;
	}
	
	if (STK.playMode === STK.PLAYMODE_ONLYLIKE && !STK.videoList[STK.videoIndex].isYouLike) {
		STK.next();
	} else if (STK.videoList[STK.videoIndex].isError) {
		STK.next();
	} else {
		STK.play();
	}
}
STK.prev = function() {
	if (STK.playMode === STK.PLAYMODE_RANDOM) {
		STK.videoIndex = Math.floor(Math.random() * STK.videoList.length);
	} else if (STK.videoIndex === 0) {
		STK.videoIndex = STK.videoList.length - 1;
	} else {
		STK.videoIndex--;
	}

	if (STK.playMode === STK.PLAYMODE_ONLYLIKE && !STK.videoList[STK.videoIndex].isYouLike) {
		STK.prev();
	} else if (STK.videoList[STK.videoIndex].isError) {
		STK.prev();
	} else {
		STK.play();
	}
}
STK.jump = function(event) {
	var row = event.currentTarget || this;
	var index = row.id.replace('video_', '');
	STK.videoIndex = index - 0;
	STK.play();
}
STK.error = function() {
	// Add error mark
	var td = $('#msg_' + STK.videoIndex);
	var originalMsg = '  ' + td.text();
	td.html('');
	td.append($('<span</span>').addClass('label important').css('opacity', 0.6).text('ERROR!!'));
	td.append($('<span></span>').text(originalMsg));
	
	// Add error flag
	STK.videoList[STK.videoIndex].isError = true;
	
	STK.next();
}
