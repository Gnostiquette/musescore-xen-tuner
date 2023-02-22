// Copyright (C) 2023 euwbah
// 
// This file is part of Xen Tuner.
// 
// Xen Tuner is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// Xen Tuner is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with Xen Tuner.  If not, see <http://www.gnu.org/licenses/>.

// When there's some syntax error the imported files and its not showing up,
// uncomment these lines
// import "generated-tables.js" as AAAAAaa
// import "lookup-tables.js" as Aaa
// import "fns.js" as Bbb

import "fns.ms.js" as Fns
import MuseScore 3.0
import QtQuick 2.9
import QtQuick.Controls 2.2
import QtQuick.Window 2.2
import QtQuick.Layouts 1.2
import Qt.labs.settings 1.0
import FileIO 3.0

MuseScore {
      version: "0.4.0"
      description: "Debug Tune function.\n\n" +
        "The docking Xen Tuner plugin is hard to debug as the shortcuts break everytime you re-run " +
        "the plugin in the plugin creator. Use this instead to test functions without having to " +
        "restart MuseScore."
      menuPath: "Plugins.Xen Tuner.Debug Xen Tuner"
      
      id: pluginId

      Component.onCompleted : {
        if (mscoreMajorVersion >= 4) {
          pluginId.title = qsTr("Xen Tuner");
          // pluginId.thumbnailName = "some_thumbnail.png";
          pluginId.categoryCode = "composing-arranging-tools";
        }
      }

      FileIO {
        id: fileIO
        source: "./"
        onError: function(err) {
          if (err.indexOf(".json") != -1) {
            console.warn("File not found: " + fileIO.source)
          } else {
            console.error(fileIO.source + ". File IO Error: " + err);
          }
        }
      }

      onRun: {
        console.log('Xen Tuner - Debug');
        // When you want to find which import has a syntax error, uncomment this line
        // console.log(JSON.stringify(Fns));
        var isMS4 = mscoreMajorVersion >= 4;
        Fns.init(Accidental, NoteType, SymId, Element,
          fileIO, Qt.resolvedUrl("../"), curScore, isMS4);

        // Debug code here.
        Fns.operationTune(); // test tune
        // Fns.operationTranspose(-1, 0); // test diatonic transpose
      }
}