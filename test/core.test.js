import {test} from 'node:test';
import assert from 'node:assert/strict';
import {seed,validate,advice,weighted} from '../lib.js';
test('seed validates',()=>assert.equal(validate(seed()).version,1));
test('attendance recovery and safe misses',()=>{assert.equal(advice({attended:7,conducted:10}).needed,2);assert.equal(advice({attended:9,conducted:10}).bunks,2);assert.equal(advice({attended:0,conducted:0}).percent,null);});
test('boundaries do not overlap',()=>{assert.equal(advice({attended:75,conducted:100}).status,'Safe');assert.equal(advice({attended:70,conducted:100}).status,'Near margin');assert.equal(advice({attended:69,conducted:100}).status,'Shortage');});
test('invalid data rejected',()=>{for(const mutate of [s=>s.subjects[0].attended=999,s=>s.settings.threshold=100,s=>s.settings.threshold=0,s=>s.subjects[0].units[0].completed=99,s=>s.courses[0].credits=0,s=>s.courses[0].grade='X',s=>s.semesters[0].sgpa=11]){const s=seed();mutate(s);assert.throws(()=>validate(s));}assert.throws(()=>validate({}));});
test('GPA uses credits and handles empty lists',()=>{assert.equal(weighted([{credits:4,p:10},{credits:2,p:7}],x=>x.p),9);assert.equal(weighted([],x=>x.p),null);});
