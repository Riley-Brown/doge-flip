// function for devices that don't support clipboard API
export function copyToClipboardHelper(str: string) {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';

  document.body.appendChild(el);

  if (navigator.userAgent.match(/ipad|ipod|iphone/i)) {
    // save current contentEditable/readOnly status
    const editable = el.contentEditable;
    const readOnly = el.readOnly;

    // convert to editable with readonly to stop iOS keyboard opening
    el.contentEditable = 'true';
    el.readOnly = true;

    // create a selectable range
    const range = document.createRange();
    range.selectNodeContents(el);

    // select the range
    var selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    el.setSelectionRange(0, 999999);

    // restore contentEditable/readOnly to original state
    el.contentEditable = editable;
    el.readOnly = readOnly;
  } else {
    el.select();
  }

  document.execCommand('copy');
  document.body.removeChild(el);
}
