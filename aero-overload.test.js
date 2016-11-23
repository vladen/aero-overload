import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);

import overload from './aero-overload.js';
import overloadSpecs from './aero-overload.specs.js';

overloadSpecs(overload, chai.expect, sinon);
