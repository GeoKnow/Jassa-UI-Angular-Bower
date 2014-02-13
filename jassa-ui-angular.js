/*
 * jassa-ui-angular
 * https://github.com/GeoKnow/Jassa-UI-Angular

 * Version: 0.0.1-SNAPSHOT - 2014-02-13
 * License: MIT
 */
angular.module("ui.jassa", ["ui.jassa.constraint-list","ui.jassa.facet-value-list","ui.jassa.facettree"]);
angular.module('ui.jassa.constraint-list', [])

;

angular.module('ui.jassa.facet-value-list', [])

/**
 * Controller for the SPARQL based FacetTree
 * Supports nested incoming and outgoing properties
 *
 */
.controller('FacetValueListCtrl', ['$rootScope', '$scope', '$q', function($rootScope, $scope, $q) {

    $scope.filterText = '';
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    
    //$scope.path = null;
    

    var facetValueService = null;
    
    var self = this;

    var ns = {};
    ns.FacetValueService = Class.create({
        initialize: function(sparqlService, facetTreeConfig) {
            this.sparqlService = sparqlService;
            this.facetTreeConfig = facetTreeConfig;
        },
      
        createFacetValueFetcher: function(path, filterText) {

            var facetConfig = this.facetTreeConfig.getFacetConfig();

            var facetConceptGenerator = facete.FaceteUtils.createFacetConceptGenerator(facetConfig);
            var concept = facetConceptGenerator.createConceptResources(path, true);
            var constraintTaggerFactory = new facete.ConstraintTaggerFactory(facetConfig.getConstraintManager());
            
            var store = new Jassa.sponate.StoreFacade(this.sparqlService);
            var labelMap = Jassa.sponate.SponateUtils.createDefaultLabelMap();
            store.addMap(labelMap, 'labels');
            labelsStore = store.labels;
            
            var criteria = {};
            if(text) {
                criteria = {$or: [
                    {hiddenLabels: {$elemMatch: {id: {$regex: text, $options: 'i'}}}},
                    {id: {$regex: text, $options: 'i'}}
                ]};
            }
            var baseFlow = labelsStore.find(criteria).concept(concept, true);

            var result = new ns.FacetValueFetcher(baseFlow);
            return resul;
        }
    });

    
    ns.FacetValueFetcher = Class.create({
                
        initialize: function(baseFlow) {
            this.baseFlow = baseFlow;
        },
        
        fetchCount: function() {
            var countPromise = baseFlow.count();
            return countPromise;
        },
        
        fetchData: function(offset, limit) {
            
            var dataFlow = this.baseFlow.skip(offset).limit(limit);

            var dataPromise = dataFlow.asList(true).pipe(function(docs) {

                var tagger = constraintTaggerFactory.createConstraintTagger(path);
                
                var r = _(docs).map(function(doc) {
                    // TODO Sponate must support retaining node objects
                    //var node = rdf.NodeFactory.parseRdfTerm(doc.id);
                    var node = doc.id;
                    
                    var label = doc.displayLabel ? doc.displayLabel : '' + doc.id;
                    //console.log('displayLabel', label);
                    var tmp = {
                        displayLabel: label,
                        path: path,
                        node: node,
                        tags: tagger.getTags(node)
                    };

                    return tmp;
                    
                });

                return r;
            });
            
            return dataPromise;
        }
    });

    var updateFacetTreeService = function() {
        var isConfigured = $scope.sparqlService && $scope.facetTreeConfig && $scope.path;

        facetValueService = isConfigured ? new ns.FacetValueService($scope.sparqlService, $scope.facetTreeConfig) : null;
    };
    
    var update = function() {
        updateFacetTreeService();
        self.refresh();
    };
    
    $scope.$watch('sparqlService', function() {
        update();
    });
    
    $scope.$watch('facetTreeConfig.hashCode()', function() {
        update();
    }, true);
    
    $scope.$watch('path', function() {
        update();
    }, true);

    
    $scope.$watch('currentPage', function() {
        //console.log("Change");
        update();
    });


    $scope.toggleConstraint = function(item) {
        var constraintManager = facetConfig.getConstraintManager();
        
        var constraint = new facete.ConstraintSpecPathValue(
                'equal',
                item.path,
                item.node);

        // TODO Integrate a toggle constraint method into the filterManager
        constraintManager.toggleConstraint(constraint);
    };
    
    
    
    self.refresh = function() {
        var path = $scope.path;
        
        if(!facetValueService || !path) {
            $scope.totalItems = 0;
            $scope.facetValues = [];
            return;
        }
        
        var fetcher = facetValueService.createFacetValueFetcher($scope.path, $scope.filterText);

        var countPromise = fetcher.fetchCount();
        
        var pageSize = 10;
        var offset = ($scope.currentPage - 1) * pageSize;
        
        var dataPromise = fetcer.fetchData(offset, pageSize);

        Jassa.sponate.angular.bridgePromise(countPromise, $q.defer(), $rootScope).then(function(count) {
            $scope.totalItems = count;
        });
        
        Jassa.sponate.angular.bridgePromise(dataPromise, $q.defer(), $rootScope).then(function(items) {
            $scope.facetValues = items;
        });

    };

    $scope.filterTable = function(filterText) {
        $scope.filterText = filterText;
        update();
    };

    
    /*
    $scope.$on('facete:facetSelected', function(ev, path) {

        $scope.currentPage = 1;
        $scope.path = path;
        
        updateItems();
    });
    
    $scope.$on('facete:constraintsChanged', function() {
        updateItems(); 
    });
    */
//  $scope.firstText = '<<';
//  $scope.previousText = '<';
//  $scope.nextText = '>';
//  $scope.lastText = '>>';

}])

/**
 * The actual dependencies are:
 * - sparqlServiceFactory
 * - facetTreeConfig
 * - labelMap (maybe this should be part of the facetTreeConfig) 
 */
.directive('facetValueList', function() {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/facet-value-list/facet-value-list.html',
        transclude: false,
        require: 'facetValueList',
        scope: {
            sparqlService: '=',
            facetTreeConfig: '=',
            path: '=',
            onSelect: '&select'
        },
        controller: 'FacetValueListCtrl'
//        compile: function(elm, attrs) {
//            return function link(scope, elm, attrs, controller) {
//            };
//        }
    };
})

;

angular.module('ui.jassa.facettree', [])

/**
 * Controller for the SPARQL based FacetTree
 * Supports nested incoming and outgoing properties
 *
 */
.controller('FacetTreeCtrl', ['$rootScope', '$scope', '$q', function($rootScope, $scope, $q) {
        
    var self = this;
      
      
    var updateFacetTreeService = function() {
        var isConfigured = $scope.sparqlService && $scope.facetTreeConfig;
        //debugger;
        $scope.facetTreeService = isConfigured ? Jassa.facete.FaceteUtils.createFacetTreeService($scope.sparqlService, $scope.facetTreeConfig, null) : null;
    };
    
    var update = function() {
        updateFacetTreeService();
        //controller.refresh();
        self.refresh();
    };
    
    $scope.$watch('sparqlService', function() {
    //console.log('args', $scope.sparqlService);
        update();
    });
    
    $scope.$watch('facetTreeConfig.hashCode()', function() {
        update();
    }, true);
              
      
    $scope.doFilter = function(path, filterString) {
        $scope.facetTreeConfig.getPathToFilterString().put(path, filterString);
        self.refresh();
    };
    
    self.refresh = function() {
                  
        var facet = $scope.facet;
        var startPath = facet ? facet.item.getPath() : new facete.Path();
    
        if($scope.facetTreeService) {
          
            var facetTreeTagger = Jassa.facete.FaceteUtils.createFacetTreeTagger($scope.facetTreeConfig.getPathToFilterString());
    
            //console.log('scopefacets', $scope.facet);             
            var promise = $scope.facetTreeService.fetchFacetTree(startPath);
              
            Jassa.sponate.angular.bridgePromise(promise, $q.defer(), $rootScope).then(function(data) {
                facetTreeTagger.applyTags(data);
                $scope.facet = data;
            });
    
        } else {
            $scope.facet = null;
        }
    };
              
    $scope.toggleCollapsed = function(path) {
        Jassa.util.CollectionUtils.toggleItem($scope.facetTreeConfig.getExpansionSet(), path);
          
        var val = $scope.facetTreeConfig.getExpansionMap().get(path);
        if(val == null) {
            $scope.facetTreeConfig.getExpansionMap().put(path, 1);
        }
          
        self.refresh();
    };
      
    $scope.selectIncoming = function(path) {
        console.log('Incoming selected at path ' + path);
        if($scope.facetTreeConfig) {
            var val = $scope.facetTreeConfig.getExpansionMap().get(path);
            if(val != 2) {
                $scope.facetTreeConfig.getExpansionMap().put(path, 2);
                self.refresh();
            }
        }
    };
      
    $scope.selectOutgoing = function(path) {
        console.log('Outgoing selected at path ' + path);
        if($scope.facetTreeConfig) {
            var val = $scope.facetTreeConfig.getExpansionMap().get(path);
            if(val != 1) {
                $scope.facetTreeConfig.getExpansionMap().put(path, 1);
                self.refresh();
            }
        }
    };
      
      
    $scope.selectFacetPage = function(page, facet) {
        var path = facet.item.getPath();
        var state = $scope.facetTreeConfig.getFacetStateProvider().getFacetState(path);
        var resultRange = state.getResultRange();
          
        console.log('Facet state for path ' + path + ': ' + state);
            var limit = resultRange.getLimit() || 0;
              
            var newOffset = limit ? (page - 1) * limit : null;
              
            resultRange.setOffset(newOffset);
            
            self.refresh();
        };
          
        $scope.toggleSelected = function(path) {
            $scope.onSelect({path: path});
        };
  
        $scope.toggleTableLink = function(path) {
            //$scope.emit('facete:toggleTableLink');
        tableMod.togglePath(path);
      
        //$scope.$emit('')
        // alert('yay' + JSON.stringify(tableMod.getPaths()));
      
        $scope.$emit('facete:refresh');
      
//        var columnDefs = tableMod.getColumnDefs();
//        _(columnDefs).each(function(columnDef) {
          
//        });
      
//        tableMod.addColumnDef(null, new ns.ColumnDefPath(path));
      //alert('yay ' + path);
        };
      
  //  $scope.$on('facete:refresh', function() {
//        $scope.refresh();
  //  });
}])

/**
 * The actual dependencies are:
 * - sparqlServiceFactory
 * - facetTreeConfig
 * - labelMap (maybe this should be part of the facetTreeConfig) 
 */
.directive('facetTree', function($parse) {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/facettree/facet-tree-item.html',
        transclude: false,
        require: 'facetTree',
        scope: {
            sparqlService: '=',
            facetTreeConfig: '=',
            onSelect: '&select'
        },
        controller: 'FacetTreeCtrl',
        compile: function(elm, attrs) {
            return function link(scope, elm, attrs, controller) {
            };
        }
    };
})

;
