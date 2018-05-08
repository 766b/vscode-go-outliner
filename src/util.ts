
'use strict';

import cp = require('child_process');

export function semver(a: string, b: string): number {
    a = a.split(' ')[1];
    b = b.split(' ')[1];
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) { return 1; }
        if (nb > na) { return -1; }
        if (!isNaN(na) && isNaN(nb)) { return 1; }
        if (isNaN(na) && !isNaN(nb)) { return -1; }
    }
    return 0;
}

export function goOutlinerInstalled(): Promise<number> {
    const minVersion = "Version 0.3.0";
    return new Promise(resolve => {
        cp.execFile("go-outliner", ["-version"], {}, (err, stdout, stderr) => {
            if (err || stderr) {
                return resolve(-2);
            }
            return resolve(semver(stdout, minVersion));
        });
    });
}