/**
 * @license calcGrid
 * (c) 2014 C J Wainwright, http://cjwainwright.co.uk
 * License: MIT
 */

var calcGrid = (function () {

    // stylesheet utilities

    var css = (function () {
        var nextId = 1000;
        
        return {
            uniqueId: function (prefix) {
                return prefix + nextId++;
            },
        
            addRule: function (sheet, selector, rules, index) {
                if (index < 0) {
                    index = sheet.cssRules.length + 1 + index;
                }
                
                if (sheet.insertRule) {
                    sheet.insertRule(selector + "{" + rules + "}", index);
                }
                else {
                    sheet.addRule(selector, rules, index);
                }
            }
        }
    })();

    // grid layout methods

    function _setSizes(sheet, gridId, sizes, startCss, endCss, classPrefix) {
        
        // process rels, replacing with relevant calc size
        // (100% - (a + b + c)) * 2 / 3
        var nonRels = [],
            rels = [],
            relIndexes = [],
            relTotal = 0;
        
        sizes.forEach(function (size, index) {
            if(size.indexOf('rel') > 0) {
                var rel = parseInt(size);
                rels.push(rel);
                relIndexes.push(index);
                relTotal += rel;
            } else {
                nonRels.push(size);
            }
        });
        
        if (rels.length > 0) {
            var relBase = nonRels.length == 0 ? '100%' : '(100% - (' + nonRels.join(' + ') + '))';
            rels.forEach(function (rel, index) {
                var relCalc = (relTotal == 0) ? '0px' : relBase + ' * ' + rel + ' / ' + relTotal;
                sizes[relIndexes[index]] = relCalc;
            });
        }

        // create all rules for start and end grid positions
        var current = '0px';
        sizes.forEach(function (size, index) {
            var start = startCss + ': calc('  + current + ');';
            var next = current + ' + ' + size;
            var end = endCss + ': calc(100% - (' + next + '));';
            
            css.addRule(sheet, '#' + gridId + ' > [data-' + classPrefix + '-start = "' + index + '"]', start + end, -1); // include rule for default end positions if not specified     
            css.addRule(sheet, '#' + gridId + ' > [data-' + classPrefix + '-end = "' + index + '"]', end, -1); // explicit end styles should have higher priority than default, place them at the end of stylesheet       

            current = next;
        });
    }

    function _create(el) {
        
        var separatorRegex = /\s*,\s*/;
        var rowSizes = el.getAttribute('data-row-sizes').split(separatorRegex), 
            colSizes = el.getAttribute('data-col-sizes').split(separatorRegex);
        
        var id = el.id || (el.id = css.uniqueId('grid'));
    
        var style = document.createElement('style');
        document.head.appendChild(style); // note, append to head, would like to append to el but this does not allow creating the styles while el is not appended to the document
        
        function _setAllSizes(rowSizes, colSizes) {
            _setSizes(style.sheet, id, rowSizes, 'top', 'bottom', 'row');
            _setSizes(style.sheet, id, colSizes, 'left', 'right', 'col');
        }
        
        _setAllSizes(rowSizes, colSizes);
        
        return {
            html: el,
            append: function (item, rowStart, colStart, rowEnd, colEnd) {
                item.setAttribute('data-row-start', rowStart);
                item.setAttribute('data-col-start', colStart);
                
                if (rowEnd != null) {
                    item.setAttribute('data-row-end', rowEnd);
                } else {
                    item.removeAttribute('data-row-end');
                }

                if (colEnd != null) {
                    item.setAttribute('data-col-end', colEnd);
                } else {
                    item.removeAttribute('data-col-end');
                }
                
                el.appendChild(item);
            }
        };
    }

    return {
        init: function (el) {
            if (el == null) {
                el = '.calc-grid';
            }
            
            if (typeof el == 'string') {
                var ret = [];
                Array.apply(null, document.querySelectorAll('.calc-grid')).forEach(function (el) { 
                    ret.push(_create(el)); 
                }, this);
                return ret;
            } else {
                return _create(el);
            }
        },
        create: function (rowSizes, colSizes) {
            var el = document.createElement('div');
            el.className = 'calc-grid';
            el.setAttribute('data-row-sizes', typeof rowSizes == 'string' ? rowSizes : rowSizes.join(','));
            el.setAttribute('data-col-sizes', typeof colSizes == 'string' ? colSizes : colSizes.join(','));
            return _create(el);
        }
    };
})();
