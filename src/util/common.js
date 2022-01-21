// Helper functions
export const getRandomInt = (max) => {
  return Math.floor(Math.random() * max);
}

const isNumeric = (str) => {
  if (typeof str != "string") return false 
  return !isNaN(str) && 
         !isNaN(parseFloat(str)) 
}

export const sanitize = (s) => {
  if (s.includes(false)) return false;
  if (s.includes(true)) return true;
  s = s.replace('\"', "");
  s = s.replace("[", "");
  s = s.replace("]", "");
  s = s.replace("{", "");
  s = s.replace("}", "");
  s = s.replace('"', "");
  s = s.trim();
  if (isNumeric(s)) return parseFloat(s);
  return s
}

String.prototype.hashCode = function() {
  var hash = 0, i, chr;
  if (this.length === 0) return hash;
  for (i = 0; i < this.length; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export const generateSessionId = () => {
  if (!localStorage.getItem('event_gen_id')) {
    let event_gen_id = JSON.stringify(new Date()).hashCode();
    localStorage.setItem('event_gen_id', event_gen_id);
    return event_gen_id;
  } else {
    localStorage.setItem('event_gen_id', localStorage.getItem('event_gen_id'));
    return localStorage.getItem('event_gen_id');
  }
}