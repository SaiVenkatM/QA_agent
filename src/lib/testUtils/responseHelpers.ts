interface TestCaseObject {
  title: string,
  description: string,
  sampleInput: string,
  expectedOutput: string
}

//TODO: type annotate this whole file, or just rewrite it

//NOTE: this file contains some helper funcitons to parse the response from the model server
export default class responseHelpers {

  static parseCoordinatesFromBoundingBox(boundingBox: any, screenWidth: number, screenHeight: number) {
    var coords = boundingBox.match(/\[\[[\d,]+\]\]/)
    if (coords == null) {
      coords = []
    } else {
      coords = coords[0].replace("[[", "").replace("]]", "").split(",")
    }
    coords = coords.map((item: any, _idx: number) => {
      return Number(item)
    })

    console.log(coords)

    let final = undefined

    if (coords.length == 4) {
      
      final = {
        x: (((coords[0] + coords[2]) / 2) * screenWidth) / 1000,
        y: (((coords[1] + coords[3]) / 2) * screenHeight) / 1000
      }


      // return [(((coords[0] + coords[2]) / 2) * screenWidth) / 1000, (((coords[1] + coords[3]) / 2) * screenHeight) / 1000]
    }
    if (coords.length == 2) {

      final = {
        x: (coords[0] * screenWidth) / 1000,
        y: (coords[1] * screenHeight) / 1000
      }
      // return [(coords[0] * screenWidth) / 1000, (coords[1] * screenHeight) / 1000]
    }

    return final

  }

  static parseStringToList(response: any) {
    const pattern = /(?=\d+\.)/
    var splitList = response.split(pattern)

    var finalList = []
    for (var s of splitList) {
      var item = s.split(/^\d+\./)
      if (item.length > 1) {
        finalList.push(item[item.length - 1].replace('\n', ''))
      }
    }
    return finalList
  }

  static parseTestCasesFromResponse(response: any) {
    const pattern = /(?=\d+\.)/
    var splitList = response.split(pattern)

    var array: Array<TestCaseObject> = []

    for (var item of splitList) {
      try {
        var title = item.split('Description:')[0].split(/(\d+\.\s)/)
        title = title[title.length - 1]
        var remaining = item.split('Description:')[1].split('Input:')
        var remainingOne = remaining[1].split('Expected Output:')
        const testObj: TestCaseObject = {
          title: title.replace('Title:', ''),
          description: remaining[0],
          sampleInput: remainingOne[0],
          expectedOutput: remainingOne[1]
        }
        array.push(testObj)
      } catch (e) {

      }

    }


    return array
  }

}


