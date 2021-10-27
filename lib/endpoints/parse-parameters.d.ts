import * as t from '@babel/types';
import type { OpenAPIV3 as o } from 'openapi-types';
/**
 * Given parameters like:
 * [
 *   { name: 'foo', in: 'query', required: false, schema: { type: 'string' } }
 *   ...
 * ]
 *
 * returns a tuple of the arguments array to the endpoint method,
 * and the properties which will be included in the fetch call,
 * which will result in code like:
 *
 *                  v opts type
 * someMethod(opts: { foo?: string } = {}) {
 *   return this.get('/path/to/some', { qs: { foo: opts.foo } }).json();
 *                                      ^ properties
 * }
 */
export default function parseParameters(parameters: (o.ReferenceObject | o.ParameterObject)[], components: o.ComponentsObject): [(t.AssignmentPattern | t.Identifier)[], t.ObjectProperty[]];
