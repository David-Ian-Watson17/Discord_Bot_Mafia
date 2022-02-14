var escape = function(regularexpression)
{
    return regularexpression.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = {
    escape: escape
}