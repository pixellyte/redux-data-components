const getIn = (o, p) => (p.length === 0 || typeof o === 'undefined' ? o : getIn(o[p[0]], p.slice(1)));

export default getIn

