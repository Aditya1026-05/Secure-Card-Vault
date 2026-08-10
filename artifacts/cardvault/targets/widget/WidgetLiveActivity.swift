import WidgetKit
import SwiftUI
import ActivityKit

// Define same attributes struct here for deserialization in the target extension
struct CardVaultAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var title: String
        var subtitle: String
        var cardType: String     // "library" or "payment"
        var cardNumber: String   // Masked card number (sent pre-masked from JS)
        var validThru: String
        var barcodeValue: String
        var barcodeType: String  // "code39", "code128", "qr", "pdf417"
        var colorName: String    // Theme color name
    }
    
    var id: String
}

@main
struct CardVaultWidgetBundle: WidgetBundle {
    var body: some Widget {
        CardVaultLiveActivity()
    }
}

struct CardVaultLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CardVaultAttributes.self) { context in
            // Lock Screen UI
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Presentation
                DynamicIslandExpandedRegion(.leading) {
                    ExpandedLeadingView(context: context)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ExpandedTrailingView(context: context)
                }
                DynamicIslandExpandedRegion(.center) {
                    ExpandedCenterView(context: context)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ExpandedBottomView(context: context)
                }
            } compactLeading: {
                CompactLeadingView(context: context)
            } compactTrailing: {
                CompactTrailingView(context: context)
            } minimal: {
                MinimalView(context: context)
            }
            .keylineTint(Color.black)
        }
    }
}

// ----------------- Color Helper -----------------
func getCardColor(for name: String) -> Color {
    switch name {
    case "green": return Color(red: 0.08, green: 0.13, blue: 0.10)
    case "lavender": return Color(red: 0.10, green: 0.09, blue: 0.13)
    case "blue": return Color(red: 0.08, green: 0.10, blue: 0.13)
    case "orange": return Color(red: 0.13, green: 0.09, blue: 0.07)
    case "graphite": return Color(red: 0.11, green: 0.12, blue: 0.13)
    case "maroon": return Color(red: 0.13, green: 0.08, blue: 0.09)
    case "brown": return Color(red: 0.11, green: 0.09, blue: 0.07)
    case "black": return Color(red: 0.05, green: 0.05, blue: 0.06)
    default: return Color(red: 0.11, green: 0.12, blue: 0.13)
    }
}

// ----------------- Lock Screen presentation -----------------
struct LockScreenView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        if context.state.cardType == "payment" {
            // Refinement 7 & Lock Screen Rules: Credit/Debit cards MUST NOT be displayed on the Lock Screen.
            // We render an empty view to hide card information completely.
            EmptyView()
        } else {
            // Library / Loyalty cards are allowed on Lock Screen (showing barcode)
            HStack(spacing: 16) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(getCardColor(for: context.state.colorName))
                        .frame(width: 42, height: 42)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.white.opacity(0.15), lineWidth: 1)
                        )
                    
                    Image(systemName: "person.badge.shield.keyhole.fill")
                        .foregroundColor(.white)
                        .font(.system(size: 18))
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.state.title)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)
                    Text(context.state.subtitle.uppercased())
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundColor(.white.opacity(0.6))
                }
                
                Spacer()
                
                if !context.state.barcodeValue.isEmpty {
                    BarcodeRenderer(value: context.state.barcodeValue, type: context.state.barcodeType)
                        .frame(width: 130, height: 38)
                        .background(Color.white)
                        .cornerRadius(4)
                }
            }
            .padding()
            .background(Color.black.opacity(0.85))
        }
    }
}

// ----------------- Compact Dynamic Island Presentations -----------------
struct CompactLeadingView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        Image(systemName: context.state.cardType == "payment" ? "creditcard.fill" : "person.badge.shield.keyhole.fill")
            .foregroundColor(.white)
            .imageScale(.medium)
    }
}

struct CompactTrailingView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        if context.state.cardType == "payment" {
            // Last 4 digits only
            Text(context.state.cardNumber.suffix(4))
                .font(.system(.caption, design: .monospaced))
                .foregroundColor(.white)
        } else {
            Text(context.state.title.prefix(10))
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.white)
        }
    }
}

struct MinimalView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        Image(systemName: context.state.cardType == "payment" ? "creditcard.fill" : "person.badge.shield.keyhole.fill")
            .foregroundColor(.white)
            .imageScale(.small)
    }
}

// ----------------- Expanded Dynamic Island Presentations -----------------
struct ExpandedLeadingView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6)
                .fill(getCardColor(for: context.state.colorName))
                .frame(width: 28, height: 20)
                .overlay(
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                )
            
            Image(systemName: context.state.cardType == "payment" ? "creditcard.fill" : "person.badge.shield.keyhole.fill")
                .foregroundColor(.white)
                .font(.system(size: 10))
        }
        .padding(.leading, 8)
    }
}

struct ExpandedTrailingView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        Text(context.state.subtitle.uppercased())
            .font(.system(size: 9, weight: .bold))
            .foregroundColor(.white.opacity(0.6))
            .padding(.trailing, 8)
    }
}

struct ExpandedCenterView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(context.state.title)
                .font(.system(size: 14, weight: .bold))
                .foregroundColor(.white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct ExpandedBottomView: View {
    let context: ActivityViewContext<CardVaultAttributes>
    
    var body: some View {
        VStack(spacing: 8) {
            if context.state.cardType == "payment" {
                HStack {
                    // Masked credit card number (Refinement 4/5: CVV and full number are never sent)
                    Text(context.state.cardNumber)
                        .font(.system(.body, design: .monospaced))
                        .foregroundColor(.white)
                    Spacer()
                    if !context.state.validThru.isEmpty {
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("VALID THRU")
                                .font(.system(size: 7))
                                .foregroundColor(.white.opacity(0.4))
                            Text(context.state.validThru)
                                .font(.system(size: 11, weight: .bold))
                                .foregroundColor(.white)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            } else if !context.state.barcodeValue.isEmpty {
                VStack(spacing: 4) {
                    BarcodeRenderer(value: context.state.barcodeValue, type: context.state.barcodeType)
                        .frame(height: 48)
                        .background(Color.white)
                        .cornerRadius(6)
                    
                    Text(context.state.barcodeValue)
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundColor(.white.opacity(0.6))
                }
                .padding(.horizontal, 12)
            }
        }
        .padding(.bottom, 8)
    }
}

// ----------------- Barcode Renderer View -----------------
struct BarcodeRenderer: View {
    let value: String
    let type: String
    
    var body: some View {
        if type == "code39" {
            Code39BarcodeView(value: value)
        } else {
            let filterName = type == "qr" ? "CIQRCodeGenerator" :
                             type == "pdf417" ? "CIPDF417BarcodeGenerator" :
                             "CICode128BarcodeGenerator"
            CoreImageBarcodeView(value: value, filterName: filterName)
        }
    }
}

// ----------------- Custom Code 39 Barcode Renderer -----------------
let code39Map: [Character: String] = [
    "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000",
    "4": "000110001", "5": "100110000", "6": "001110000", "7": "000100101",
    "8": "100100100", "9": "001100100", "A": "100001001", "B": "001001001",
    "C": "101001000", "D": "000011001", "E": "100011000", "F": "001011000",
    "G": "000001101", "H": "100001100", "I": "001001100", "J": "000011100",
    "K": "100000011", "L": "001000011", "M": "101000010", "N": "000010011",
    "O": "100010010", "P": "001010010", "Q": "000000111", "R": "100000110",
    "S": "001000110", "T": "000010110", "U": "110000001", "V": "011000001",
    "W": "111000000", "X": "010010001", "Y": "110010000", "Z": "011010000",
    "-": "010000101", ".": "110000100", " ": "011000100", "*": "010010100",
    "$": "010101000", "/": "010100010", "+": "010001010", "%": "000101010"
]

struct Code39BarcodeView: View {
    let value: String
    
    var body: some View {
        GeometryReader { geo in
            let bars = generateBars()
            let totalUnits = bars.reduce(0.0) { $0 + $1.width }
            let unitWidth = totalUnits > 0 ? geo.size.width / totalUnits : 0
            
            HStack(spacing: 0) {
                ForEach(0..<bars.count, id: \.self) { index in
                    let bar = bars[index]
                    Rectangle()
                        .fill(bar.isBar ? Color.black : Color.clear)
                        .frame(width: bar.width * unitWidth)
                }
            }
        }
        .padding(.vertical, 4)
        .padding(.horizontal, 8)
    }
    
    struct BarElement {
        let isBar: Bool
        let width: CGFloat
    }
    
    private func generateBars() -> [BarElement] {
        let rawVal = value.uppercased()
        let filtered = rawVal.filter { code39Map[$0] != nil }
        let finalStr = filtered.hasPrefix("*") && filtered.hasSuffix("*") ? filtered : "*\(filtered)*"
        
        var result: [BarElement] = []
        
        for charIndex in 0..<finalStr.count {
            let char = finalStr[finalStr.index(finalStr.startIndex, offsetBy: charIndex)]
            guard let pattern = code39Map[char] else { continue }
            
            for i in 0..<9 {
                let isBar = i % 2 == 0
                let isWide = pattern[pattern.index(pattern.startIndex, offsetBy: i)] == "1"
                result.append(BarElement(isBar: isBar, width: isWide ? 2.5 : 1.0))
            }
            
            if charIndex < finalStr.count - 1 {
                result.append(BarElement(isBar: false, width: 1.0))
            }
        }
        
        return result
    }
}

// ----------------- CoreImage Barcode View (QR, Code128, PDF417) -----------------
struct CoreImageBarcodeView: View {
    let value: String
    let filterName: String
    
    var body: some View {
        if let image = generateBarcodeImage() {
            Image(uiImage: image)
                .resizable()
                .interpolation(.none)
                .scaledToFit()
                .padding(.vertical, 4)
                .padding(.horizontal, 8)
        } else {
            Text(value)
                .font(.system(.body, design: .monospaced))
                .foregroundColor(.black)
                .padding(.vertical, 8)
        }
    }
    
    private func generateBarcodeImage() -> UIImage? {
        guard let data = value.data(using: .ascii) else { return nil }
        
        guard let filter = CIFilter(name: filterName) else { return nil }
        
        if filterName == "CIQRCodeGenerator" {
            filter.setValue(data, forKey: "inputMessage")
            filter.setValue("M", forKey: "inputCorrectionLevel")
        } else {
            filter.setValue(data, forKey: "inputMessage")
        }
        
        guard let outputImage = filter?.outputImage else { return nil }
        
        let scaleX: CGFloat = filterName == "CIQRCodeGenerator" ? 10.0 : 6.0
        let scaleY: CGFloat = filterName == "CIQRCodeGenerator" ? 10.0 : 6.0
        let transformedImage = outputImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
        
        let context = CIContext()
        if let cgImage = context.createCGImage(transformedImage, from: transformedImage.extent) {
            return UIImage(cgImage: cgImage)
        }
        return nil
    }
}
