import enforceServiceOrchestration from "./lib/rules/enforce-service-orchestration.js";
import enforceStepStructure from "./lib/rules/enforce-step-structure.js";
import enforceMaddoxBoilerplate from "./lib/rules/enforce-maddox-boilerplate.js";
import enforceProxyStructure from "./lib/rules/enforce-proxy-structure.js";
import enforceNoForbiddenWords from "./lib/rules/enforce-no-forbidden-words.js";
import enforceNoUnusedSteps from "./lib/rules/enforce-no-unused-steps.js";
import enforceControllerOrchestration from "./lib/rules/enforce-controller-orchestration.js";
import enforceMaddoxCoverage from "./lib/rules/enforce-maddox-coverage.js";
import enforceMaddoxControllerCoverage from "./lib/rules/enforce-maddox-controller-coverage.js";
import enforceMaddoxModuleCoverage from "./lib/rules/enforce-maddox-module-coverage.js";
import enforceMaddoxScenarioOrder from "./lib/rules/enforce-maddox-scenario-order.js";
import enforceMaddoxScenarioChainOneLine from "./lib/rules/enforce-maddox-scenario-chain-one-line.js";
import enforceMaddoxScenarioMockSurface from "./lib/rules/enforce-maddox-scenario-mock-surface.js";
import enforceMaddoxModuleDescribeStructure from "./lib/rules/enforce-maddox-module-describe-structure.js";
import enforceMaddoxDescribeStructure from "./lib/rules/enforce-maddox-describe-structure.js";
import enforceMaddoxBeforeEachSetupOrder from "./lib/rules/enforce-maddox-before-each-setup-order.js";
import enforceMaddoxBeforeEachMiddleSetupContent from "./lib/rules/enforce-maddox-before-each-middle-setup-content.js";
import enforceMaddoxSetupParamsArray from "./lib/rules/enforce-maddox-setup-params-array.js";
import enforceMaddoxMiddleSetupCardinality from "./lib/rules/enforce-maddox-middle-setup-cardinality.js";
import enforceArchitecturalLayerAccess from "./lib/rules/enforce-architectural-layer-access.js";
import enforceModuleMinSteps from "./lib/rules/enforce-module-min-steps.js";
import enforceNoStepLoopInternalFunction from "./lib/rules/enforce-no-step-loop-internal-function.js";
import enforceStepIteratorSimplicity from "./lib/rules/enforce-step-iterator-simplicity.js";
import enforceStepMaxFileLines from "./lib/rules/enforce-step-max-file-lines.js";
import enforceNoRepoWritesInLoops from "./lib/rules/enforce-no-repo-writes-in-loops.js";
import enforceInjectableBoundedFanout from "./lib/rules/enforce-injectable-bounded-fanout.js";
import enforceNoProcessEnvExceptGlobal from "./lib/rules/enforce-no-process-env-except-global.js";
import enforceRepositoryModelMapping from "./lib/rules/enforce-repository-model-mapping.js";
import enforceRouteCatchErrr from "./lib/rules/enforce-route-catch-errr.js";
import enforceNoServiceMockInRouteControllerSpec from "./lib/rules/enforce-no-service-mock-in-route-controller-spec.js";
import enforceMaddoxItSetupOverrideOrder from "./lib/rules/enforce-maddox-it-setup-override-order.js";
import enforceStateGetterSetterStructure from "./lib/rules/enforce-state-getter-setter-structure.js";
import enforceNoStepMockInMaddoxTest from "./lib/rules/enforce-no-step-mock-in-maddox-test.js";
import enforceJsxSpecForUiRoutes from "./lib/rules/enforce-jsx-spec-for-ui-routes.js";
import enforceMaddoxLoaderActionSeparation from "./lib/rules/enforce-maddox-loader-action-separation.js";
import enforceApiContractTesting from "./lib/rules/enforce-api-contract-testing.js";
import enforceRemixScenarioForUiRouteTests from "./lib/rules/enforce-remix-scenario-for-ui-route-tests.js";
import enforceUiRouteSpecSingleton from "./lib/rules/enforce-ui-route-spec-singleton.js";
import enforceNoFromPromiseInUiSpec from "./lib/rules/enforce-no-from-promise-in-ui-spec.js";
import enforceNoServiceEntryPointInMaddoxSpec from "./lib/rules/enforce-no-service-entry-point-in-maddox-spec.js";
import enforceNoMaddoxShouldBeCalledWithSubset from "./lib/rules/enforce-no-maddox-should-be-called-with-subset.js";
import enforceNoMaddoxIgnoreParam from "./lib/rules/enforce-no-maddox-ignore-param.js";
import enforceNoVitestMockInFromPromiseSpec from "./lib/rules/enforce-no-vitest-mock-in-from-promise-spec.js";
import enforceLoggerStaticMessage from "./lib/rules/enforce-logger-static-message.js";
import enforceErrorLogAtIngress from "./lib/rules/enforce-error-log-at-ingress.js";
import enforceNoEmptyCatch from "./lib/rules/enforce-no-empty-catch.js";
import enforceIfThrowUsePrecondition from "./lib/rules/enforce-if-throw-use-precondition.js";
import enforceNoServiceFromStep from "./lib/rules/enforce-no-service-from-step.js";
import enforceModuleAcceptNotStepNext from "./lib/rules/enforce-module-accept-not-step-next.js";
import enforceErrrAppendTo from "./lib/rules/enforce-errr-append-to.js";
import enforceNoBrowserApiOutsideProxy from "./lib/rules/enforce-no-browser-api-outside-proxy.js";
import enforceNoRouteOptionsPreflight from "./lib/rules/enforce-no-route-options-preflight.js";
import enforceNoRouteAuthCheck from "./lib/rules/enforce-no-route-auth-check.js";
import enforceNoMaddoxCompareOutsideScenario from "./lib/rules/enforce-no-maddox-compare-outside-scenario.js";
import enforceOutboundClassMethodCall from "./lib/rules/enforce-outbound-class-method-call.js";
import enforceIngressContractValidation from "./lib/rules/enforce-ingress-contract-validation.js";
import enforceMaddoxValidationCoverage from "./lib/rules/enforce-maddox-validation-coverage.js";
import enforceControllerRouteByVerbOrPath from "./lib/rules/enforce-controller-route-by-verb-or-path.js";

export default {
  rules: {
    "enforce-service-orchestration": enforceServiceOrchestration,
    "enforce-step-structure": enforceStepStructure,
    "enforce-maddox-boilerplate": enforceMaddoxBoilerplate,
    "enforce-proxy-structure": enforceProxyStructure,
    "enforce-no-forbidden-words": enforceNoForbiddenWords,
    "enforce-no-unused-steps": enforceNoUnusedSteps,
    "enforce-controller-orchestration": enforceControllerOrchestration,
    "enforce-maddox-coverage": enforceMaddoxCoverage,
    "enforce-maddox-controller-coverage": enforceMaddoxControllerCoverage,
    "enforce-maddox-module-coverage": enforceMaddoxModuleCoverage,
    "enforce-maddox-scenario-order": enforceMaddoxScenarioOrder,
    "enforce-maddox-scenario-chain-one-line": enforceMaddoxScenarioChainOneLine,
    "enforce-maddox-scenario-mock-surface": enforceMaddoxScenarioMockSurface,
    "enforce-maddox-module-describe-structure": enforceMaddoxModuleDescribeStructure,
    "enforce-maddox-describe-structure": enforceMaddoxDescribeStructure,
    "enforce-maddox-before-each-setup-order": enforceMaddoxBeforeEachSetupOrder,
    "enforce-maddox-before-each-middle-setup-content": enforceMaddoxBeforeEachMiddleSetupContent,
    "enforce-maddox-setup-params-array": enforceMaddoxSetupParamsArray,
    "enforce-maddox-middle-setup-cardinality": enforceMaddoxMiddleSetupCardinality,
    "enforce-architectural-layer-access": enforceArchitecturalLayerAccess,
    "enforce-step-iterator-simplicity": enforceStepIteratorSimplicity,
    "enforce-step-max-file-lines": enforceStepMaxFileLines,
    "enforce-no-step-loop-internal-function": enforceNoStepLoopInternalFunction,
    "enforce-module-min-steps": enforceModuleMinSteps,
    "enforce-no-repo-writes-in-loops": enforceNoRepoWritesInLoops,
    "enforce-injectable-bounded-fanout": enforceInjectableBoundedFanout,
    "enforce-no-process-env-except-global": enforceNoProcessEnvExceptGlobal,
    "enforce-repository-model-mapping": enforceRepositoryModelMapping,
    "enforce-route-catch-errr": enforceRouteCatchErrr,
    "enforce-no-service-mock-in-route-controller-spec": enforceNoServiceMockInRouteControllerSpec,
    "enforce-maddox-it-setup-override-order": enforceMaddoxItSetupOverrideOrder,
    "enforce-state-getter-setter-structure": enforceStateGetterSetterStructure,
    "enforce-no-step-mock-in-maddox-test": enforceNoStepMockInMaddoxTest,
    "enforce-jsx-spec-for-ui-routes": enforceJsxSpecForUiRoutes,
    "enforce-maddox-loader-action-separation": enforceMaddoxLoaderActionSeparation,
    "enforce-api-contract-testing": enforceApiContractTesting,
    "enforce-remix-scenario-for-ui-route-tests": enforceRemixScenarioForUiRouteTests,
    "enforce-ui-route-spec-singleton": enforceUiRouteSpecSingleton,
    "enforce-no-from-promise-in-ui-spec": enforceNoFromPromiseInUiSpec,
    "enforce-no-service-entry-point-in-maddox-spec": enforceNoServiceEntryPointInMaddoxSpec,
    "enforce-no-maddox-should-be-called-with-subset": enforceNoMaddoxShouldBeCalledWithSubset,
    "enforce-no-maddox-ignore-param": enforceNoMaddoxIgnoreParam,
    "enforce-no-vitest-mock-in-from-promise-spec": enforceNoVitestMockInFromPromiseSpec,
    "enforce-logger-static-message": enforceLoggerStaticMessage,
    "enforce-error-log-at-ingress": enforceErrorLogAtIngress,
    "enforce-no-empty-catch": enforceNoEmptyCatch,
    "enforce-if-throw-use-precondition": enforceIfThrowUsePrecondition,
    "enforce-no-service-from-step": enforceNoServiceFromStep,
    "enforce-module-accept-not-step-next": enforceModuleAcceptNotStepNext,
    "enforce-errr-append-to": enforceErrrAppendTo,
    "enforce-no-browser-api-outside-proxy": enforceNoBrowserApiOutsideProxy,
    "enforce-no-route-options-preflight": enforceNoRouteOptionsPreflight,
    "enforce-no-route-auth-check": enforceNoRouteAuthCheck,
    "enforce-no-maddox-compare-outside-scenario": enforceNoMaddoxCompareOutsideScenario,
    "enforce-outbound-class-method-call": enforceOutboundClassMethodCall,
    "enforce-ingress-contract-validation": enforceIngressContractValidation,
    "enforce-maddox-validation-coverage": enforceMaddoxValidationCoverage,
    "enforce-controller-route-by-verb-or-path": enforceControllerRouteByVerbOrPath,
  },
};
