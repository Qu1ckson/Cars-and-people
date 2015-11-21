var LastImg = {};

function handleAddImg(){
	if( !checkFillField() )
		return;
	var divDragObjects = document.getElementById('dragObjects');
	divDragObjects.innerHTML += ['<img class="draggable"'+formHint()+ 'src="'+ LastImg.src+
					'" id="'+ LastImg.id+ '" whichCar=\"\"/>'].join('');
	clearField();
	document.getElementById('list').insertBefore(divDragObjects, null);
}

function handleOnChange( field ){
	field.classList.remove('wrong');
}

function clearField( field ){
	var firstName = document.getElementById('firstName');
	var lastName = document.getElementById('lastName');
	var selectFile = document.getElementById('files');
	firstName.value = "";
	lastName.value = "";
	selectFile.result = "";
}

function formHint(){
	//return "onmouseover=\"toolTip('" + LastImg.firstName + "<br>" + LastImg.lastName + "<br>')\"onmouseout=\"toolTip()\""; 
	var tmp = "title=\"" +LastImg.firstName + "\n" + LastImg.lastName + "\"";
	return tmp;
}

function onPaste(event, input)
{	
	var val = event.clipboardData.getData('Text');
	return  (/^[А-ЯЁ][а-яё]*$|^[а-яё]*$/.test(val));
}

function onKeyPressEvent(event, input)
{
	var symbol = String.fromCharCode(event.keyCode);
	if( input.value == "" )
	{
		var regular = new RegExp("[А-ЯЁ]"); 
		if (regular.test(symbol))
			return true;
		else false;
	}
	var tmp_str = input.value.substring( 0,event.currentTarget.selectionStart );
	tmp_str += symbol;
	tmp_str += input.value.substring( event.currentTarget.selectionStart,input.value.length );
	var regular = new RegExp("^[А-ЯЁ][а-яё]*$"); 
	if (!regular.test(tmp_str)) { 
		return false; 
	} 
	return true;
}

function checkFillField(){
	var isOk = true;
	
	if( LastImg.src === undefined ){
		isOk = false;
		var selectFile = document.getElementById('files');
		selectFile.classList.add('wrong');
	}
	var firstName = document.getElementById('firstName');
	var lastName = document.getElementById('lastName');
	if( firstName.value == "" ){
		isOk = false;
		firstName.classList.add('wrong');
	}
	else 
		LastImg.firstName = firstName.value;
	if( lastName.value == "" ){
		isOk = false;
		lastName.classList.add('wrong');
	}
	else
		LastImg.lastName = lastName.value;
	return isOk;
}

function handlerLeavePeople( carId ){
	var car = document.getElementById( carId );
	var count = car.getAttribute( "occupiedSeats" );
	
	var people = document.getElementsByClassName('draggable');

	for( var i = 0; i < people.length; i++ )
	{
		if( people[i].getAttribute( "whichCar" ) == carId )
			if(people[i].className.indexOf( "insideFull" ) > -1)
			{
				people[i].classList.remove('insideFull');
				people[i].classList.add('inside');
				return;
			}
	}
}

function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object
	document.getElementById('files').classList.remove('wrong');
	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {

	  // Only process image files.
	  if (!f.type.match('image.*')) {
		continue;
	  }

	  var reader = new FileReader();

	  // Closure to capture the file information.
	  reader.onload = (function(theFile) {
		return function(e) {
		  // Render thumbnail.
		  var divDragObjects = document.getElementById('dragObjects');
		  LastImg.src = e.target.result;
		  LastImg.id = theFile.name;
		};
	  })(f);

	  // Read in the image file as a data URL.
	  reader.readAsDataURL(f);
	}
 }
  
var DragManager = new function() {
  /**
   * составной объект для хранения информации о переносе:
   * {
   *   elem - элемент, на котором была зажата мышь
   *   avatar - аватар
   *   downX/downY - координаты, на которых был mousedown
   *   shiftX/shiftY - относительный сдвиг курсора от угла элемента
   * }
   */
  var dragObject = {};

  var self = this;

  function onMouseDown(e) {

    if (e.which != 1) return;

    var elem = e.target.closest('.draggable');
    if (!elem) return;

    dragObject.elem = elem;

    // запомним, что элемент нажат на текущих координатах pageX/pageY
    dragObject.downX = e.pageX;
    dragObject.downY = e.pageY;

    return false;
  }

  function onMouseMove(e) {
    if (!dragObject.elem) return; // элемент не зажат

    if (!dragObject.avatar) { // если перенос не начат...
      var moveX = e.pageX - dragObject.downX;
      var moveY = e.pageY - dragObject.downY;

      // если мышь передвинулась в нажатом состоянии недостаточно далеко
      if (Math.abs(moveX) < 3 && Math.abs(moveY) < 3) {
        return;
      }

      // начинаем перенос
      dragObject.avatar = createAvatar(e); // создать аватар
      if (!dragObject.avatar) { // отмена переноса, нельзя "захватить" за эту часть элемента
        dragObject = {};
        return;
      }

      // аватар создан успешно
      // создать вспомогательные свойства shiftX/shiftY
      var coords = getCoords(dragObject.avatar);
      dragObject.shiftX = dragObject.downX - coords.left;
      dragObject.shiftY = dragObject.downY - coords.top;

      startDrag(e); // отобразить начало переноса
    }

    // отобразить перенос объекта при каждом движении мыши
    dragObject.avatar.style.left = e.pageX - dragObject.shiftX + 'px';
    dragObject.avatar.style.top = e.pageY - dragObject.shiftY + 'px';

    return false;
  }

  function onMouseUp(e) {
    if (dragObject.avatar) { // если перенос идет
      finishDrag(e);
    }

    // перенос либо не начинался, либо завершился
    // в любом случае очистим "состояние переноса" dragObject
    dragObject = {};
  }

  function finishDrag(e) {
    var dropElem = findDroppable(e);

    if (!dropElem) {
      self.onDragCancel(dragObject);
    } else {
      self.onDragEnd(dragObject, dropElem);
    }
  }

  function createAvatar(e) {

    // запомнить старые свойства, чтобы вернуться к ним при отмене переноса
    var avatar = dragObject.elem;
    var old = {
      parent: avatar.parentNode,
      nextSibling: avatar.nextSibling,
      position: avatar.position || '',
      left: avatar.left || '',
      top: avatar.top || '',
      zIndex: avatar.zIndex || ''
    };

    // функция для отмены переноса
    avatar.rollback = function() {
      old.parent.insertBefore(avatar, old.nextSibling);
      avatar.style.position = old.position;
      avatar.style.left = old.left;
      avatar.style.top = old.top;
      avatar.style.zIndex = old.zIndex
    };

    return avatar;
  }

  function startDrag(e) {
    var avatar = dragObject.avatar;

    // инициировать начало переноса
    document.body.appendChild(avatar);
    avatar.style.zIndex = 9999;
    avatar.style.position = 'absolute';
  }

  function findDroppable(event) {
    // спрячем переносимый элемент
    dragObject.avatar.hidden = true;

    // получить самый вложенный элемент под курсором мыши
    var elem = document.elementFromPoint(event.clientX, event.clientY);

    // показать переносимый элемент обратно
    dragObject.avatar.hidden = false;

    if (elem == null) {
      // такое возможно, если курсор мыши "вылетел" за границу окна
      return null;
    }

    return elem.closest('.droppable');
  }

  document.onmousemove = onMouseMove;
  document.onmouseup = onMouseUp;
  document.onmousedown = onMouseDown;

  this.onDragEnd = function(dragObject, dropElem) {};
  this.onDragCancel = function(dragObject) {};

};


function getCoords(elem) { // кроме IE8-
  var box = elem.getBoundingClientRect();

  return {
    top: box.top + pageYOffset,
    left: box.left + pageXOffset
  };

}