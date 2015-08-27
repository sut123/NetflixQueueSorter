var sortInstant = true; //Whether to push (sorted) instantWatch to bottom  of list
var sortType = 'predicted'; //Sorts on Predicted or Average Ratings
var secSort = 'age'; //Secondary sort on Age or Alphabetical
var sortOrder = 'desc'; //Sort ascending or descending
var secSortOrder = 'asc'; //Secondary sort order
var maintainSeries = true; //Lump series, in order, on the list
var tempObj = {}, dvdQueue = [], seriesObject = {}, instantWatchArray = [], starClass, starText, seriesRatings = {};

var queue = document.querySelectorAll('#MainQueueForm tr') //full array (for caching)
var queueLength = queue.length //full length of array
for (var i = 1; i < queueLength; i++) { // first tr is junk data
	//Identify series
	if (queue[i].className.length > 0) {
		tempObj.isSeries = true;
		tempObj.series = queue[i].className;
	} else {
		tempObj.isSeries = false;
	}
	tempObj.currentOrder = parseInt(queue[i].querySelectorAll('.pr input.o')[0].value) // order number
	tempObj.title = queue[i].querySelectorAll('.tt .title')[0].innerText //title
	tempObj.discNumber = queue[i].dataset.mid; //disc number (primarily for sorting series)

	//Get both predicted and average ratings
	//Ratings only are listed for the first in a series
	if (queue[i].querySelectorAll('.stbrMaskFg')[0]) {
		//Predicted ratings
		starClass = queue[i].querySelectorAll('.stbrMaskFg')[0].className.split(' ');
		for (var z = 0, s = starClass.length; z < s; z++) {
			if(starClass[z].indexOf('sbmf-') > -1) {
				tempObj.predictedRating = parseInt(starClass[z].replace('sbmf-', ''), 10)/10;
				if(tempObj.isSeries){seriesRatings[tempObj.series + '-predicted'] = tempObj.predictedRating;}
			}
		}
		//Average ratings
		starText = queue[i].querySelectorAll('.stbrMaskFg')[0].innerText.split(': ');
		tempObj.rating = parseFloat(starText[1]);
		if(tempObj.isSeries){seriesRatings[tempObj.series] = tempObj.rating;}
	//If is not the first in a series
	} else if (tempObj.isSeries && seriesRatings[tempObj.series] && seriesRatings[tempObj.series + '-predicted']) {
		tempObj.predictedRating = seriesRatings[tempObj.series + '-predicted'];
		tempObj.rating = seriesRatings[tempObj.series];
	}

	//Whether is available for instant watch
	queue[i].querySelectorAll('.wi')[0].innerText.length > 0 ? tempObj.isInstantWatch = true : tempObj.isInstantWatch = false;

	//Push series to new placeholder object to maintain grouping
	if (tempObj.isSeries && maintainSeries) {
		if (seriesObject[tempObj.series] === undefined) {seriesObject[tempObj.series] = [];}
		seriesObject[tempObj.series].push(tempObj);
	}

	//Push instantWatch to new placeholder array to maintain grouping
	if (tempObj.isInstantWatch && sortInstant) {
		instantWatchArray.push(tempObj);
	}
	dvdQueue.push(tempObj);
	tempObj = {};
}

function compareSort(a, b, sortOrder) {
	if(sortOrder === 'desc') {
		return b-a;
	} else {
		return a-b;
	}
}

function sortQueue(sortType, sortOrder, queue, startsAt, lumpSeries) {
	var offset = startsAt || 0;
	var accountedforSeries = {};
	var seriesLump = lumpSeries || false;
	queue = queue.sort(function(a, b){
		//Sort by Predicted Rating (Descending)
		if(sortType === 'predicted') {
			//if same rating, sort by secSort
			if (b.predictedRating === a.predictedRating) {
				if(secSort === 'age') {
					if(secSortOrder === 'desc') {
						return b.discNumber-a.discNumber;
					} else {
						return a.discNumber-b.discNumber;
					}
				} else {
					if(secSortOrder === 'desc') {
						return b.title-a.title;
					} else {
						return a.title-b.title;
					}
				}
			} else {
				if(sortOrder === 'desc') {
					return b.predictedRating-a.predictedRating;
				} else {
					return a.predictedRating-b.predictedRating;
				}
			}
		//Sort by Average Rating (Descending)
		} else if(sortType === 'average') {
			//if same rating, sort by age
			if (b.rating === a.rating) {
				if(secSort === 'age') {
					if(secSortOrder === 'desc') {
						return b.discNumber-a.discNumber;
					} else {
						return a.discNumber-b.discNumber;
					}
				} else {
					if(secSortOrder === 'desc') {
						return b.title-a.title;
					} else {
						return a.title-b.title;
					}
				}
			} else {
				if(sortOrder === 'desc') {
					return b.rating-a.rating;
				} else {
					return a.rating-b.rating;
				}
			}
		} else if(sortType === 'series') {
			return a.discNumber-b.discNumber;
		}
	});
	var numbered = 1;
	for (var i = 0, ql = queue.length; i < ql; i++) {
		if((sortInstant && offset === 0 && !queue[i].isInstantWatch) || offset !== 0) {
			if(seriesLump && maintainSeries) {
				if(!queue[i].isSeries){
					queue[i].newSort = offset + numbered;
					numbered++;
				} else if (accountedforSeries[queue[i].series] === undefined) {
					queue[i].newSort = offset + numbered;
					accountedforSeries[queue[i].series] = 1;
					numbered += seriesObject[queue[i].series].length;
				} if (queue[i].isSeries && accountedforSeries[queue[i].series] !== undefined) {
					queue[i].newSort = offset + (numbered - (seriesObject[queue[i].series].length - accountedforSeries[queue[i].series]));
					accountedforSeries[queue[i].series]++;
				}
			} else {
				queue[i].newSort = offset + numbered;
				numbered++;
			}
		}
	}

	//Return to original order
	queue = queue.sort(function(a, b){
	 return a.currentOrder-b.currentOrder
	});
	return queue;
}

function returnToQueue (newQueue, masterQueue) {
	for(var i = 0, q = newQueue.length; i < q; i++) {
		for(var x = 0, y = masterQueue.length; x < y; x++) {
			if(newQueue[i].title === masterQueue[x].title) {
				masterQueue[x] = newQueue[i];
				break;
			}
		}
	}
	return masterQueue;
}

sortQueue(sortType, sortOrder, dvdQueue);
if (sortInstant) {
	sortQueue(sortType, sortOrder, instantWatchArray, (dvdQueue.length - instantWatchArray.length), true);
	returnToQueue(instantWatchArray, dvdQueue);
}
if (maintainSeries) {
	for(var key in seriesObject) {
		var offset = 0;
		for (var i = 0, x = dvdQueue.length; i < x; i++) {
			for (var y = 0, z = seriesObject[key].length; y < z; y++) {
				if(dvdQueue[i].title === seriesObject[key][y].title && (offset === 0 || offset > dvdQueue[i].newSort)) {
					offset = dvdQueue[i].newSort;
				}
			}
		}
		sortQueue('series', sortOrder, seriesObject[key], offset - 2);
		returnToQueue(seriesObject[key], dvdQueue);
	}
}

//// Inject back into page
function Save() {
	for (var i = 1; i < queueLength; i++) {
		queue[i].querySelectorAll('.pr input.o')[0].value = dvdQueue[i - 1].newSort; // order number
	}
	document.forms["MainQueueForm"].submit();
}

//Create sort button
var newSpan = document.createElement("span");
var sortButton = document.createElement('input');
sortButton.id = 'Sort';
sortButton.type = 'button';
sortButton.value = 'Sort';
sortButton.name = 'Sort';
newSpan.appendChild(sortButton);
document.getElementsByTagName('h2')[1].insertBefore(newSpan, document.getElementsByClassName('hButtonWrapper')[0]);

function OnSortClick() {
	Save();
}

var button = document.getElementById('Sort');
if (button.addEventListener) {   // all browsers except IE before version 9
	button.addEventListener('click', OnSortClick, false);
} else {
	if (button.attachEvent) {    // IE before version 9
		button.attachEvent('onclick', OnSortClick);
	}
}
