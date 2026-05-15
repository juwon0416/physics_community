const escapeAttribute = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const inlineFormula = (value: string) =>
    `<span class="ql-formula" data-value="${escapeAttribute(value)}"></span>`;

const displayFormula = (value: string) =>
    `<p class="ql-align-center math-block"><span class="ql-formula ql-formula-display" data-display="true" data-value="${escapeAttribute(value)}"></span></p>`;

const heading = (value: string, level: 1 | 2 | 3 = 2) =>
    `<h${level} class="ql-align-center">${value}</h${level}>`;

const paragraph = (value: string) =>
    `<p class="ql-align-center">${value}</p>`;

const note = (value: string) =>
    `<p class="ql-align-center"><span style="opacity: 0.72;">${value}</span></p>`;

const lead = (value: string) =>
    `<p class="ql-align-center"><strong>${value}</strong></p>`;

const softNote = (value: string) =>
    `<p class="ql-align-center"><em><span style="opacity: 0.72;">${value}</span></em></p>`;

const spacer = () =>
    '<p class="ql-align-center"><br></p>';

const renderList = (items: string[], ordered = false) => {
    const tag = ordered ? 'ol' : 'ul';
    const markup = items.map((item) => `<li>${item}</li>`).join('');
    return `<${tag}>${markup}</${tag}>`;
};

const planckQuantizationContent = [
    heading('Planck Quantization', 1),
    paragraph('<strong>Black-Body Radiation, Resonators, and the Energy Element</strong>'),
    paragraph('<em>A structured archive note for the physics editor</em>'),

    heading('Abstract'),
    paragraph(
        `Planck quantization begins with a very concrete problem: the universal spectrum of black-body radiation. The classical theory correctly counts electromagnetic cavity modes, but it assigns thermal energy to those modes in a way that fails catastrophically at high frequency. Planck's decisive step was to keep the classical mode structure while changing the statistical rule for energy exchange. In his resonator model, energy is counted in finite elements proportional to frequency, ${inlineFormula(String.raw`h\nu`)}, and this produces the Planck radiation law.`,
    ),

    heading('1. The Black-Body Problem'),
    paragraph(
        `A black body is an ideal absorber and emitter of radiation. In practice, it can be approximated by a small opening in a heated cavity: radiation entering the hole is repeatedly reflected and absorbed, while radiation leaving the hole samples the cavity's equilibrium field.`,
    ),
    paragraph(
        `The quantity to be explained is the spectral energy density ${inlineFormula(String.raw`u(\nu,T)`)}, the energy per unit volume per unit frequency near frequency ${inlineFormula(String.raw`\nu`)} at temperature ${inlineFormula(String.raw`T`)}.`,
    ),
    displayFormula(String.raw`u(\nu,T)`),
    paragraph(
        `Kirchhoff's theorem made this problem fundamental. At thermal equilibrium, the spectrum is universal: it depends on temperature and frequency, not on the detailed material composition of the cavity walls.`,
    ),

    heading('2. What Classical Physics Gets Right'),
    paragraph(
        `The electromagnetic field inside a cavity decomposes into standing-wave normal modes. Counting these modes is a classical Maxwellian calculation. In a volume ${inlineFormula(String.raw`V`)}, the number of modes in the interval ${inlineFormula(String.raw`\nu`)} to ${inlineFormula(String.raw`\nu+d\nu`)} is proportional to ${inlineFormula(String.raw`\nu^2`)}`,
    ),
    displayFormula(String.raw`g(\nu)d\nu=\frac{8\pi V\nu^2}{c^3}\,d\nu`),
    paragraph(
        `This mode-counting factor is not the part that fails. It remains present in the final Planck spectrum. The difficulty is the energy assigned to each frequency sector.`,
    ),
    paragraph(
        `It is useful to separate the spectrum into two conceptual pieces: the number of available modes and the mean energy assigned to each mode.`,
    ),
    displayFormula(String.raw`u(\nu,T)=\frac{g(\nu)}{V}\,\overline{E}(\nu,T)`),
    note('mode density × mean energy per mode'),

    heading('3. Why Equipartition Fails'),
    paragraph(
        `Classical statistical mechanics assigns the same average thermal energy to each mode. In this setting, equipartition gives`,
    ),
    displayFormula(String.raw`\overline{E}_{\mathrm{cl}}=k_{\mathrm B}T`),
    paragraph(
        `Substituting this into the mode-counting formula gives the Rayleigh-Jeans spectrum.`,
    ),
    displayFormula(String.raw`u_{\mathrm{RJ}}(\nu,T)=\frac{8\pi\nu^2}{c^3}k_{\mathrm B}T`),
    paragraph(
        `This formula works at low frequency, but it grows without bound as frequency increases. The total radiative energy would be`,
    ),
    displayFormula(String.raw`U_{\mathrm{tot}}=\int_0^\infty u_{\mathrm{RJ}}(\nu,T)\,d\nu`),
    paragraph(
        `and this integral diverges. This is the ultraviolet catastrophe. The failure is therefore not the cavity mode structure, but the classical assumption about mean energy.`,
    ),

    heading('4. Planck\'s Resonator Picture'),
    paragraph(
        `Planck did not initially introduce photons. His historical model used material resonators in the cavity walls. A resonator of frequency ${inlineFormula(String.raw`\nu`)} exchanges energy with radiation of the same frequency.`,
    ),
    paragraph(
        `The resonator should be understood as a frequency-selective material degree of freedom. It is not identical to a single wavevector mode. Rather, it provides the matter-radiation exchange mechanism needed for equilibrium.`,
    ),
    paragraph(
        `Planck then considered many resonators of the same frequency and asked how their total energy could be statistically distributed.`,
    ),

    heading('5. The Energy Element'),
    paragraph(
        `Let ${inlineFormula(String.raw`N`)} resonators of frequency ${inlineFormula(String.raw`\nu`)} have total energy ${inlineFormula(String.raw`U_N`)}, with mean resonator energy ${inlineFormula(String.raw`U`)}`,
    ),
    displayFormula(String.raw`U_N=NU`),
    paragraph(
        `Planck divided this total energy into a large number of finite elements. If each element has size ${inlineFormula(String.raw`\varepsilon`)}, then`,
    ),
    displayFormula(String.raw`U_N=P\varepsilon`),
    paragraph(
        `Counting the possible distributions of ${inlineFormula(String.raw`P`)} identical energy elements among ${inlineFormula(String.raw`N`)} distinguishable resonators gives a Boltzmann entropy. The important point is not the combinatorics alone, but the fact that the energy is no longer treated as continuously divisible.`,
    ),
    paragraph(
        `Wien's displacement law then forces the energy element to scale with frequency. Planck's energy element is`,
    ),
    displayFormula(String.raw`\varepsilon=h\nu`),
    paragraph(
        `Here ${inlineFormula(String.raw`h`)} is a universal constant. This is the first appearance of the quantum of action in the black-body problem.`,
    ),

    heading('6. Mean Energy in Planck\'s Theory'),
    paragraph(
        `Using the entropy of the discretely counted resonators and the thermodynamic relation between entropy and temperature, Planck obtained the corrected mean energy`,
    ),
    displayFormula(String.raw`\overline{E}(\nu,T)=\frac{h\nu}{\exp(h\nu/k_{\mathrm B}T)-1}`),
    paragraph(
        `This expression contains both the classical limit and the quantum suppression mechanism. At low frequency, where ${inlineFormula(String.raw`h\nu\ll k_{\mathrm B}T`)}, it reduces to ${inlineFormula(String.raw`k_{\mathrm B}T`)}. At high frequency, where ${inlineFormula(String.raw`h\nu\gg k_{\mathrm B}T`)}, it becomes exponentially small.`,
    ),
    displayFormula(String.raw`\overline{E}(\nu,T)\sim h\nu\,\exp(-h\nu/k_{\mathrm B}T)`),

    heading('7. The Planck Spectrum'),
    paragraph(
        `The final spectrum is obtained by keeping the classical mode density and replacing the classical mean energy with Planck's mean energy.`,
    ),
    displayFormula(String.raw`u(\nu,T)=\frac{8\pi h\nu^3}{c^3}\frac{1}{\exp(h\nu/k_{\mathrm B}T)-1}`),
    paragraph(
        `This formula agrees with Rayleigh-Jeans at low frequency and with Wien's high-frequency behavior at short wavelengths. More importantly, the exponential factor prevents the ultraviolet divergence.`,
    ),

    heading('8. Historical Meaning'),
    paragraph(
        `Planck quantization was not originally a fully developed photon theory. Historically, it entered as a statistical rule for resonator energy exchange. The electromagnetic field still retained its classical mode structure; what changed was the way microscopic energy was counted.`,
    ),
    paragraph(
        `This is why Planck's result is both continuous with classical physics and radically new. Maxwellian modes remain, Kirchhoff universality remains, and thermal equilibrium remains. But the continuous classical distribution of energy is replaced by finite energy elements.`,
    ),
    paragraph(
        `Later developments, especially Einstein's light quantum, extended the meaning of ${inlineFormula(String.raw`h\nu`)}. In Planck's original route, however, the central step was the resonator energy element.`,
    ),

    heading('9. Summary'),
    paragraph(
        `The logic of Planck quantization can be compressed into one sentence: classical physics counts the modes correctly, but quantum theory supplies the correct mean energy per mode.`,
    ),
    displayFormula(String.raw`u(\nu,T)=\frac{g(\nu)}{V}\,\overline{E}(\nu,T)`),
    paragraph(
        `The mode density grows like ${inlineFormula(String.raw`\nu^2`)}, but the mean energy is exponentially suppressed at high frequency. This balance produces a finite, universal black-body spectrum and marks the beginning of quantum theory.`,
    ),

    heading('References'),
    paragraph('Planck, M., <em>On the Law of Distribution of Energy in the Normal Spectrum</em>, 1901.'),
    paragraph('Planck, M., <em>The Theory of Heat Radiation</em>, 1914.'),
    paragraph('Wien, W., <em>On the Laws of Thermal Radiation</em>, Nobel Lecture, 1911.'),
].join('');

const perfectConductorContent = [
    heading('Perfect Conductor', 1),
    paragraph('<strong>Boundary Conditions at a Perfect Conductor</strong>'),
    paragraph('<em>A logical derivation from charge redistribution and Maxwell\'s equations</em>'),

    heading('Abstract'),
    paragraph(
        `A perfect conductor is the ideal limit in which free charges can rearrange without resistive cost. Any nonzero electric field inside the material would drive charge motion, so equilibrium requires the interior field to vanish, ${inlineFormula(String.raw`\mathbf{E}_{\mathrm{in}}=0`)}. Once that interior condition is fixed, the interface relations follow from Maxwell's integral laws applied to infinitesimal pillboxes and loops. The resulting boundary conditions say that the tangential electric field vanishes at the surface, the normal electric displacement is supplied by surface charge, the normal magnetic flux is continuous and becomes zero under the usual zero-interior-field assumption, and the tangential magnetic field is supported by surface current.`,
    ),
    spacer(),

    heading('1. Physical Idealization'),
    lead('A perfect conductor is the zero-resistance limit of a conductor, not a different field theory.'),
    paragraph(
        `In macroscopic electrodynamics, perfect conduction is modeled as the limit of infinite conductivity. The point of the idealization is simple: mobile charges can move freely enough to cancel any electric field that would otherwise persist in the interior.`,
    ),
    paragraph(
        `If an interior field were present, free charges would experience a force and continue to move. Because there is no resistive mechanism to arrest that motion, the only static equilibrium compatible with perfect conduction is one in which the interior electric field has been screened away.`,
    ),
    displayFormula(String.raw`\mathbf{J}=\sigma\mathbf{E}`),
    paragraph(
        `In the ideal limit ${inlineFormula(String.raw`\sigma\to\infty`)}, a finite steady current density cannot coexist with a finite electric field. The equilibrium interior statement is therefore`,
    ),
    displayFormula(String.raw`\mathbf{E}_{\mathrm{in}}=0`),
    paragraph(
        `That equation is the starting point of the boundary-value problem, not the final answer.`,
    ),

    heading('2. Interior Consequences'),
    lead('Vanishing interior electric field makes the conductor an equipotential region.'),
    paragraph(
        `Because ${inlineFormula(String.raw`\mathbf{E}=-\nabla\phi`)}, the condition ${inlineFormula(String.raw`\mathbf{E}_{\mathrm{in}}=0`)} implies`,
    ),
    displayFormula(String.raw`\nabla\phi=0\qquad\Rightarrow\qquad \phi=\text{constant inside the conductor}`),
    paragraph(
        `So the conducting surface is an equipotential surface, and any exterior electric field that survives must be normal to that surface.`,
    ),
    paragraph(
        `For time-dependent fields, Faraday's law gives`,
    ),
    displayFormula(String.raw`\nabla\times\mathbf{E}=-\frac{\partial\mathbf{B}}{\partial t}`),
    paragraph(
        `If the electric field vanishes throughout the conductor, then the interior magnetic field cannot change in time:`,
    ),
    displayFormula(String.raw`\frac{\partial\mathbf{B}_{\mathrm{in}}}{\partial t}=0`),
    paragraph(
        `So the magnetic flux trapped inside a perfect conductor is fixed by the initial condition. The common simplification ${inlineFormula(String.raw`\mathbf{B}_{\mathrm{in}}=0`)} is therefore an extra assumption, not a consequence of perfect conduction alone.`,
    ),
    softNote('This is why a perfect conductor preserves its initial interior magnetic field, whereas a superconductor expels flux in equilibrium.'),
    spacer(),

    heading('3. Maxwell Interface Relations'),
    lead('The surface conditions come from Maxwell equations in integral form.'),
    paragraph(
        `Shrink a Gaussian pillbox or a rectangular loop across the interface, keep only finite contributions, and the standard jump conditions appear.`,
    ),
    displayFormula(String.raw`\mathbf{n}\cdot(\mathbf{D}_1-\mathbf{D}_2)=\sigma_s`),
    displayFormula(String.raw`\mathbf{n}\cdot(\mathbf{B}_1-\mathbf{B}_2)=0`),
    displayFormula(String.raw`\mathbf{n}\times(\mathbf{E}_1-\mathbf{E}_2)=0`),
    displayFormula(String.raw`\mathbf{n}\times(\mathbf{H}_1-\mathbf{H}_2)=\mathbf{K}_s`),
    paragraph(
        `Here ${inlineFormula(String.raw`\sigma_s`)} is the free surface charge density and ${inlineFormula(String.raw`\mathbf{K}_s`)} is the surface current density. These are general Maxwell interface conditions; the perfect-conductor limit enters only after the interior fields are specialized.`,
    ),

    heading('4. Electric Field Conditions'),
    lead('The tangential electric field must vanish, while the normal electric field is carried by surface charge.'),
    paragraph(
        `Use Faraday's law on an infinitesimal loop that straddles the surface. As the loop height shrinks to zero, the magnetic flux through it vanishes if the fields remain finite. The tangential component of the electric field is therefore continuous across the interface.`,
    ),
    paragraph(
        `Since the interior tangential field is zero, the exterior tangential field must also vanish:`,
    ),
    displayFormula(String.raw`\mathbf{n}\times\mathbf{E}_{\mathrm{out}}=0`),
    paragraph(
        `This is the cleanest physical signature of the perfect-conductor boundary. If a tangential component existed, it would keep driving surface charge motion until it disappeared.`,
    ),
    paragraph(
        `The normal component is controlled by Gauss's law. A pillbox crossing the surface gives`,
    ),
    displayFormula(String.raw`\mathbf{n}\cdot\mathbf{D}_{\mathrm{out}}=\sigma_s`),
    paragraph(
        `In vacuum, where ${inlineFormula(String.raw`\mathbf{D}_{\mathrm{out}}=\varepsilon_0\mathbf{E}_{\mathrm{out}}`)}, this becomes`,
    ),
    displayFormula(String.raw`\mathbf{n}\cdot\mathbf{E}_{\mathrm{out}}=\frac{\sigma_s}{\varepsilon_0}`),
    paragraph(
        `So the normal electric field does not have to vanish. It is precisely the field supported by the surface charge density.`,
    ),

    heading('5. Magnetic Field Conditions'),
    lead('The magnetic boundary conditions split into continuity of normal flux and a surface-current jump in the tangential field.'),
    paragraph(
        `The absence of magnetic monopoles gives`,
    ),
    displayFormula(String.raw`\nabla\cdot\mathbf{B}=0`),
    paragraph(
        `A pillbox argument then implies continuity of the normal magnetic flux density:`,
    ),
    displayFormula(String.raw`\mathbf{n}\cdot(\mathbf{B}_{\mathrm{out}}-\mathbf{B}_{\mathrm{in}})=0`),
    paragraph(
        `If the interior magnetic field is taken to vanish, this reduces to`,
    ),
    displayFormula(String.raw`\mathbf{n}\cdot\mathbf{B}_{\mathrm{out}}=0`),
    paragraph(
        `So the exterior magnetic field is tangent to the surface under the usual zero-interior-field assumption.`,
    ),
    paragraph(
        `The tangential magnetic field is fixed by the surface current. Applying the Ampère-Maxwell law to a loop crossing the interface gives`,
    ),
    displayFormula(String.raw`\mathbf{n}\times(\mathbf{H}_{\mathrm{out}}-\mathbf{H}_{\mathrm{in}})=\mathbf{K}_s`),
    paragraph(
        `If ${inlineFormula(String.raw`\mathbf{H}_{\mathrm{in}}=0`)}, then`,
    ),
    displayFormula(String.raw`\mathbf{n}\times\mathbf{H}_{\mathrm{out}}=\mathbf{K}_s`),
    paragraph(
        `For a nonmagnetic exterior, ${inlineFormula(String.raw`\mathbf{B}=\mu_0\mathbf{H}`)}, so the same statement can be written as`,
    ),
    displayFormula(String.raw`\mathbf{n}\times\mathbf{B}_{\mathrm{out}}=\mu_0\mathbf{K}_s`),
    paragraph(
        `The magnetic field is therefore not eliminated at the surface. It is sustained by a surface current, just as the normal electric field is sustained by surface charge.`,
    ),

    heading('6. Boundary Conditions at a Glance'),
    lead('The surface splits the electromagnetic field into charge-driven and current-driven parts.'),
    paragraph('The final conditions outside an ideal perfect conductor, under the zero-interior-field simplification, are'),
    displayFormula(String.raw`\mathbf{n}\times\mathbf{E}_{\mathrm{out}}=0`),
    paragraph('Tangential electric field vanishes.'),
    displayFormula(String.raw`\mathbf{n}\cdot\mathbf{D}_{\mathrm{out}}=\sigma_s`),
    paragraph('Normal electric displacement is supplied by surface charge.'),
    displayFormula(String.raw`\mathbf{n}\cdot\mathbf{B}_{\mathrm{out}}=0`),
    paragraph('Normal magnetic flux density vanishes when the interior magnetic field is taken to be zero.'),
    displayFormula(String.raw`\mathbf{n}\times\mathbf{H}_{\mathrm{out}}=\mathbf{K}_s`),
    paragraph('Tangential magnetic field is supplied by surface current.'),
    spacer(),

    heading('7. Perfect Conductor vs. Superconductor'),
    lead('Do not confuse the perfect-conductor idealization with the Meissner effect.'),
    paragraph(
        `A perfect conductor enforces ${inlineFormula(String.raw`\mathbf{E}_{\mathrm{in}}=0`)}, but it does not by itself expel an already-present magnetic field. The interior magnetic field stays fixed at whatever value the initial condition supplies.`,
    ),
    paragraph(
        `A superconductor is different: in equilibrium it expels magnetic flux. So ${inlineFormula(String.raw`\mathbf{B}_{\mathrm{in}}=0`)} is an extra initial-condition assumption in this derivation, not the defining content of perfect conduction.`,
    ),

    heading('8. Conclusion'),
    lead('Perfect conduction turns a physical screening process into a set of sharp electromagnetic boundary conditions.'),
    paragraph(
        `The logical chain is simple. Zero resistance means any interior electric field would immediately drive charge rearrangement. That rearrangement produces an induced field that cancels the original one, giving ${inlineFormula(String.raw`\mathbf{E}_{\mathrm{in}}=0`)}. Maxwell's equations then convert that interior condition into surface constraints: the tangential electric field vanishes, the normal electric displacement is carried by surface charge, the normal magnetic flux is continuous and often zero under the usual idealization, and the tangential magnetic field is carried by surface current.`,
    ),
    paragraph(
        `The result is not a set of disconnected formulas, but a single chain of reasoning from ideal conduction to charge redistribution, from redistribution to field cancellation, and from Maxwell's equations to boundary conditions.`,
    ),
    spacer(),

    heading('References'),
    paragraph('OpenStax, <em>University Physics Volume 2</em>, Sec. 6.4, Conductors in Electrostatic Equilibrium, 2016.'),
    paragraph('Feynman, R. P., Leighton, R. B., and Sands, M., <em>The Feynman Lectures on Physics</em>, Vol. II, Ch. 6 and Ch. 33.'),
    paragraph('Staelin, D. H., <em>Electromagnetics and Applications</em>, Boundary Conditions for Electromagnetic Fields.'),
].join('');

const densityOfStateContent = [
    heading('Density of State', 1),
    paragraph('<strong>From Occupation Random Variables to the Density of States</strong>'),
    paragraph('<em>A probabilistic derivation of the DOS factor</em>'),
    spacer(),

    heading('Abstract', 2),
    lead('The density of states is a state-counting object, not a probability density.'),
    paragraph(
        `The density of states is often introduced through the heuristic statement that the number of particles near an energy is obtained by multiplying an occupation function by the number of available states. This note reformulates that statement in probabilistic language.`,
    ),
    paragraph(
        `The central object is not the set of energy values alone, but an occupation configuration space built from microscopic states. For each microscopic state, an occupation random variable is defined, and the mean occupation of an energy shell is obtained as the expectation value of a sum of such variables.`,
    ),
    paragraph(
        `In the discrete setting this gives the degeneracy factor. The discrete density of states is then written as a delta-function measure, whose coarse-grained thermodynamic limit gives the usual continuum density of states.`,
    ),
    softNote(
        `This is why ${inlineFormula(String.raw`D(E)f(E)dE`)} represents a mean particle number in an energy interval rather than a probability density for energy itself.`,
    ),
    spacer(),

    heading('1. Introduction', 2),
    lead('The conceptual issue is the difference between an energy value and the microscopic states that realize it.'),
    paragraph(
        `Classical mechanics describes the motion of a particle deterministically once its initial position and momentum are specified. Statistical mechanics, by contrast, is designed for systems with many degrees of freedom, where the central question is not the exact trajectory of every particle but the statistical distribution of particles over accessible microscopic states.`,
    ),
    paragraph(
        `In equilibrium, the mean occupation of a single-particle state depends on the physical nature of the particles. For distinguishable classical particles one obtains the Maxwell-Boltzmann form in the dilute limit, while indistinguishable bosons and fermions are described by Bose-Einstein and Fermi-Dirac mean occupation functions, respectively.`,
    ),
    paragraph(
        `A common source of confusion is the relation between an occupation function and the number of particles at a given energy. A function such as ${inlineFormula(String.raw`f(E)`)} should not be interpreted as the probability that the energy value ${inlineFormula(String.raw`E`)} itself is selected.`,
    ),
    paragraph(
        `Rather, ${inlineFormula(String.raw`f(E)`)} is the mean occupation of an individual microscopic state whose energy is ${inlineFormula(String.raw`E`)}. Since many distinct microscopic states may share the same energy, the total mean occupation at that energy requires an additional counting factor.`,
    ),
    softNote('That counting factor is the discrete precursor of the density of states.'),
    paragraph(
        `The density of states is therefore not a probability distribution over energy. It is a state-counting object obtained by projecting microscopic states onto the energy axis and asking how many states lie near each energy.`,
    ),
    paragraph(
        `The purpose of this note is to show, in a probabilistic way, why this state-counting object multiplies the occupation function in mean occupation calculations.`,
    ),
    spacer(),

    heading('2. Microscopic States and the Energy Projection', 2),
    lead('Start with microscopic states first; energy values appear only after projection.'),
    paragraph(
        `Let ${inlineFormula(String.raw`\mathcal{S}`)} denote the set of single-particle microscopic states. Each state ${inlineFormula(String.raw`s\in\mathcal{S}`)} has an energy`,
    ),
    displayFormula(String.raw`\varepsilon_s\in\mathbb{R}`),
    paragraph('The energy projection is the map'),
    displayFormula(String.raw`\varepsilon:\mathcal{S}\to\mathbb{R},\qquad s\mapsto\varepsilon_s`),
    paragraph('This map is generally many-to-one. If the possible energies are discrete, denote them by'),
    displayFormula(String.raw`E_1,E_2,E_3,\ldots`),
    paragraph(`The set of microscopic states with energy ${inlineFormula(String.raw`E_n`)} is`),
    displayFormula(String.raw`\mathcal{S}_{E_n}=\{s\in\mathcal{S}:\varepsilon_s=E_n\}`),
    paragraph('Its cardinality is the degeneracy of that energy level:'),
    displayFormula(String.raw`g_n=|\mathcal{S}_{E_n}|`),
    paragraph(
        `Thus the list of energy values alone,`,
    ),
    displayFormula(String.raw`\{E_1,E_2,E_3,\ldots\}`),
    paragraph(
        `is not the full microscopic state space. The correct object is the collection of states lying above those energy values.`,
    ),
    paragraph(
        `Equivalently, states at energy ${inlineFormula(String.raw`E_n`)} may be labeled as`,
    ),
    displayFormula(String.raw`(E_n,1),(E_n,2),\ldots,(E_n,g_n)`),
    softNote(
        `The density of states later quantifies how densely the microscopic states of ${inlineFormula(String.raw`\mathcal{S}`)} are mapped onto the energy axis.`,
    ),
    spacer(),

    heading('3. Occupation Configuration Space', 2),
    lead('The occupation function is an expectation value attached to each microscopic state.'),
    paragraph(
        `Mean occupation numbers are naturally defined on an occupation configuration space. Instead of using only a binary occupation space, we allow a general occupation variable.`,
    ),
    paragraph(
        `Let ${inlineFormula(String.raw`n_s`)} denote the occupation number of microscopic state ${inlineFormula(String.raw`s`)}. Its allowed values depend on the particle type:`,
    ),
    displayFormula(String.raw`n_s\in\mathcal{A},\qquad \mathcal{A}=\begin{cases}\{0,1\}, & \text{fermions},\\ \mathbb{N}_0, & \text{bosons}.\end{cases}`),
    paragraph(
        `For dilute classical particles, the same formalism is used with ${inlineFormula(String.raw`f(E)`)} interpreted as the classical mean occupation of a single-particle state.`,
    ),
    paragraph('The occupation configuration space is'),
    displayFormula(String.raw`\Omega_{\mathrm{occ}}=\mathcal{A}^{\mathcal{S}}`),
    paragraph(`An element ${inlineFormula(String.raw`\omega\in\Omega_{\mathrm{occ}}`)} is a full assignment`),
    displayFormula(String.raw`\omega=(n_s(\omega))_{s\in\mathcal{S}}`),
    paragraph(`A probability measure ${inlineFormula(String.raw`P`)} is assigned to configurations:`),
    displayFormula(String.raw`P:\Omega_{\mathrm{occ}}\to[0,1],\qquad \sum_{\omega\in\Omega_{\mathrm{occ}}}P(\omega)=1`),
    paragraph(
        `with the obvious replacement of the sum by the appropriate measure-theoretic expression when the configuration space is infinite.`,
    ),
    paragraph(`For each state ${inlineFormula(String.raw`s`)}, the occupation random variable is`),
    displayFormula(String.raw`n_s:\Omega_{\mathrm{occ}}\to\mathcal{A}`),
    paragraph('Its expectation value is'),
    displayFormula(String.raw`\langle n_s\rangle=\sum_{m\in\mathcal{A}}m\,P(n_s=m)`),
    paragraph(
        `In equilibrium, microscopic states with the same energy have the same mean occupation. Therefore, if ${inlineFormula(String.raw`\varepsilon_s=E`)}, one writes`,
    ),
    displayFormula(String.raw`\langle n_s\rangle=f(E)`),
    paragraph(`where ${inlineFormula(String.raw`f(E)`)} is the single-state occupation function. For example,`),
    displayFormula(String.raw`f_{\mathrm{FD}}(E)=\frac{1}{e^{\beta(E-\mu)}+1},\qquad f_{\mathrm{BE}}(E)=\frac{1}{e^{\beta(E-\mu)}-1}`),
    softNote('These are the Fermi-Dirac and Bose-Einstein mean occupation functions, respectively.'),
    spacer(),

    heading('4. Discrete Energy Shells', 2),
    lead('The degeneracy factor appears because one sums many occupation random variables at the same energy.'),
    paragraph(
        `Consider a discrete energy level ${inlineFormula(String.raw`E_n`)}. The total occupation number associated with this energy is the random variable`,
    ),
    displayFormula(String.raw`N(E_n)=\sum_{s\in\mathcal{S}_{E_n}}n_s`),
    paragraph('Taking expectation values gives'),
    displayFormula(String.raw`\langle N(E_n)\rangle=\mathbb{E}\left[\sum_{s\in\mathcal{S}_{E_n}}n_s\right]=\sum_{s\in\mathcal{S}_{E_n}}\mathbb{E}[n_s]`),
    paragraph(
        `Using the equilibrium relation ${inlineFormula(String.raw`\mathbb{E}[n_s]=f(E_n)`)} for all ${inlineFormula(String.raw`s\in\mathcal{S}_{E_n}`)},`,
    ),
    displayFormula(String.raw`\langle N(E_n)\rangle=\sum_{s\in\mathcal{S}_{E_n}}f(E_n)=g_n f(E_n)`),
    softNote(
        `The factor ${inlineFormula(String.raw`g_n`)} is therefore not introduced by hand; it is the number of microscopic occupation variables being summed at fixed energy.`,
    ),
    paragraph('For the full discrete spectrum,'),
    displayFormula(String.raw`\langle N_{\mathrm{tot}}\rangle=\sum_n \langle N(E_n)\rangle=\sum_n g_n f(E_n)`),
    paragraph('This is the discrete form of the density-of-states formula.'),
    lead('Finite example'),
    paragraph(
        `Suppose an energy ${inlineFormula(String.raw`E_1`)} has three microscopic states and an energy ${inlineFormula(String.raw`E_2`)} has five microscopic states. If their single-state mean occupations are ${inlineFormula(String.raw`f(E_1)`)} and ${inlineFormula(String.raw`f(E_2)`)}, then`,
    ),
    displayFormula(String.raw`\langle N(E_1)\rangle=3f(E_1),\qquad \langle N(E_2)\rangle=5f(E_2)`),
    paragraph(
        `The numerical factor is not itself a probability. It counts how many occupation variables contribute to the energy shell.`,
    ),
    spacer(),

    heading('5. The Discrete Density of States as a Measure', 2),
    lead('The discrete DOS packages degeneracy into a single distribution on the energy axis.'),
    paragraph(
        `The previous result can be packaged into a single object on the energy axis. For a discrete spectrum, define the discrete density of states by`,
    ),
    displayFormula(String.raw`D_{\mathrm{disc}}(E)=\sum_{s\in\mathcal{S}}\delta(E-\varepsilon_s)`),
    paragraph('Equivalently, after grouping states by degenerate energy levels,'),
    displayFormula(String.raw`D_{\mathrm{disc}}(E)=\sum_n g_n\delta(E-E_n)`),
    paragraph(
        `This expression should be understood as a measure or distribution, not as an ordinary smooth function. Its meaning is fixed by integration against a suitable test function ${inlineFormula(String.raw`F(E)`)}:`,
    ),
    displayFormula(String.raw`\int D_{\mathrm{disc}}(E)F(E)\,dE=\sum_{s\in\mathcal{S}}F(\varepsilon_s)=\sum_n g_nF(E_n)`),
    paragraph(`Choosing ${inlineFormula(String.raw`F(E)=f(E)`)} gives`),
    displayFormula(String.raw`\int D_{\mathrm{disc}}(E)f(E)\,dE=\sum_n g_nf(E_n)=\langle N_{\mathrm{tot}}\rangle`),
    softNote(
        `Therefore the discrete DOS exactly reproduces the sum over microscopic states. It is a compact way to encode degeneracy on the energy axis.`,
    ),
    spacer(),

    heading('6. Coarse-Graining and the Continuum Limit', 2),
    lead('A smooth density emerges only after coarse-graining the discrete energy spectrum.'),
    paragraph(
        `For a finite system the discrete DOS is a collection of delta functions, and the cumulative state count is a step function. A smooth density emerges only after a thermodynamic or coarse-graining limit.`,
    ),
    paragraph('Consider an energy interval'),
    displayFormula(String.raw`I_E=[E,E+\Delta E)`),
    paragraph('The number of microscopic states in this interval is'),
    displayFormula(String.raw`\Delta\mathcal{N}(E;\Delta E)=\#\{s\in\mathcal{S}:E\leq\varepsilon_s<E+\Delta E\}`),
    paragraph('Equivalently,'),
    displayFormula(String.raw`\Delta\mathcal{N}(E;\Delta E)=\int_E^{E+\Delta E}D_{\mathrm{disc}}(E')\,dE'`),
    paragraph('The occupation number in this interval is'),
    displayFormula(String.raw`N_{I_E}=\sum_{s:\,\varepsilon_s\in I_E}n_s`),
    paragraph('Its mean is'),
    displayFormula(String.raw`\langle N_{I_E}\rangle=\sum_{s:\,\varepsilon_s\in I_E}f(\varepsilon_s)`),
    paragraph(
        `If the interval is narrow on the scale over which ${inlineFormula(String.raw`f(E)`)} varies, then ${inlineFormula(String.raw`f(\varepsilon_s)\approx f(E)`)} for ${inlineFormula(String.raw`\varepsilon_s\in I_E`)}, and`,
    ),
    displayFormula(String.raw`\langle N_{I_E}\rangle\approx f(E)\sum_{s:\,\varepsilon_s\in I_E}1=f(E)\Delta\mathcal{N}(E;\Delta E)`),
    paragraph(
        `The smooth density of states is obtained by replacing the rapidly peaked discrete measure by its coarse-grained density,`,
    ),
    displayFormula(String.raw`D(E)\approx\frac{\Delta\mathcal{N}(E;\Delta E)}{\Delta E}`),
    paragraph('under the scale separation'),
    displayFormula(String.raw`\delta E\ll \Delta E\ll E_{\mathrm{macro}}`),
    paragraph(
        `Here ${inlineFormula(String.raw`\delta E`)} is the typical microscopic level spacing, while ${inlineFormula(String.raw`E_{\mathrm{macro}}`)} is the energy scale over which ${inlineFormula(String.raw`f(E)`)} and other macroscopic quantities vary appreciably.`,
    ),
    paragraph('Under this condition,'),
    displayFormula(String.raw`\Delta\mathcal{N}(E;\Delta E)\approx D(E)\Delta E`),
    paragraph('Thus'),
    displayFormula(String.raw`\langle N_{[E,E+\Delta E)}\rangle\approx D(E)f(E)\Delta E`),
    paragraph('In differential notation,'),
    displayFormula(String.raw`dN(E)=D(E)f(E)dE`),
    softNote(
        `This is the standard continuum expression: ${inlineFormula(String.raw`D(E)dE`)} counts the states in the interval, while ${inlineFormula(String.raw`f(E)`)} gives the mean occupation of each state.`,
    ),
    paragraph('The total mean particle number is therefore'),
    displayFormula(String.raw`\langle N_{\mathrm{tot}}\rangle=\int D(E)f(E)\,dE`),
    paragraph(
        `This continuum replacement is analogous to the usual thermodynamic-limit replacement of sums over microscopic state labels by integrals over continuous variables.`,
    ),
    spacer(),

    heading('7. Interpretation', 2),
    lead('The whole construction can be read as one expectation-value identity.'),
    paragraph('The probabilistic content of the DOS factor can now be summarized in one line:'),
    displayFormula(String.raw`\mathbb{E}\left[\sum_{s:\,E\leq\varepsilon_s<E+dE} n_s\right]=D(E)f(E)dE`),
    paragraph(
        `The left-hand side is the expectation value of a sum of occupation random variables. The right-hand side is its continuum representation.`,
    ),
    paragraph(
        `The DOS is the part that counts how many microscopic states are present near energy ${inlineFormula(String.raw`E`)}; the occupation function is the part that gives the mean occupation of each such state.`,
    ),
    paragraph(
        `This also clarifies why ${inlineFormula(String.raw`D(E)`)} should not be normalized like a probability density. In general,`,
    ),
    displayFormula(String.raw`\int D(E)\,dE`),
    paragraph(
        `counts the total number of available single-particle states in the relevant Hilbert space or energy range, not one. By contrast, a probability distribution over energies would have to integrate to unity.`,
    ),
    softNote(
        `The product ${inlineFormula(String.raw`D(E)f(E)dE`)} is therefore not "probability times energy width," but the mean number of occupied microscopic states in an energy window.`,
    ),
    spacer(),

    heading('8. Conclusion', 2),
    lead('Density of states follows from summing occupation variables over microscopic states, then projecting to energy.'),
    paragraph(
        `The density of states arises from a simple but important distinction: microscopic states are not the same as energy values. Many microscopic states may project to the same energy, and each such state carries its own occupation random variable.`,
    ),
    paragraph(
        `In the discrete case, summing those random variables over a fixed energy shell gives the degeneracy factor ${inlineFormula(String.raw`g_n`)} multiplying the single-state occupation function ${inlineFormula(String.raw`f(E_n)`)}.`,
    ),
    paragraph('The same information can be encoded by the discrete DOS measure'),
    displayFormula(String.raw`D_{\mathrm{disc}}(E)=\sum_s\delta(E-\varepsilon_s)`),
    paragraph(
        `which becomes a smooth density after coarse-graining or in the thermodynamic limit. The continuum formula`,
    ),
    displayFormula(String.raw`dN(E)=D(E)f(E)dE`),
    paragraph(
        `therefore follows directly from probability theory: it is the expectation value of the total occupation number in a small energy interval.`,
    ),
    spacer(),

    heading('References', 2),
    paragraph('Kok, P., <em>Bose-Einstein and Fermi-Dirac Statistics</em>, Physics LibreTexts, Sec. 8.4, 2021.'),
    paragraph('Baldo, M., <em>How many electrons? Fermi-Dirac Statistics</em>, Engineering LibreTexts, Sec. 2.2, 2022.'),
    paragraph('Kardar, M., <em>Lecture 23: Ideal Quantum Gases Part 2</em>, MIT OpenCourseWare 8.333 Statistical Mechanics I, Fall 2013.'),
].join('');

const mosCapacitorFetContent = [
    heading('Field Effect Transistor - MOS capacitor', 1),
    paragraph('<strong>Gate voltage, surface potential, and carrier regime in the ideal MOS capacitor.</strong>'),
    paragraph('<em>A graph-native ontology note for the semiconductor physics chapter</em>'),
    spacer(),

    heading('Abstract'),
    paragraph(
        'This note reconstructs the MOS capacitor lecture as a concept graph plus an argument graph. The concept graph collects the reusable notions: field effect transistor, MOS capacitor, flat-band voltage, surface potential, depletion width, threshold voltage, accumulation, depletion, inversion, and non-ideal oxide or interface charge. The argument graph records the lecture logic: electric field induces charge redistribution, the gate voltage divides between oxide and semiconductor, and the surface potential determines which carrier regime is realized.',
    ),
    paragraph(
        'The result is a reusable foundation for the MOSFET topic that follows.',
    ),

    heading('1. Concept Graph'),
    lead('Reusable concept nodes for the MOS capacitor story.'),
    renderList([
        'Field effect transistor',
        'MOS capacitor',
        'Gate oxide',
        'Flat-band condition',
        'Surface potential',
        'Fermi potential',
        'Accumulation',
        'Depletion',
        'Inversion',
        'Threshold voltage',
        'Depletion width',
        'Flat-band voltage',
        'Non-ideal MOS',
        'Oxide charge',
        'Interface charge',
        'Capacitance-voltage characteristics',
    ]),

    heading('2. Argument Graph'),
    lead('Directed proof-like flow of the lecture.'),
    renderList([
        'Problem: explain how a gate can control charge in a semiconductor without direct current through the oxide.',
        'Assumption: the oxide is ideal, charge-free, and highly resistive.',
        'Derivation step: the electric field in the oxide is constant, so the gate bias divides into oxide voltage and semiconductor band bending.',
        'Result: the flat-band condition marks the reference state with no net semiconductor charge.',
        'Derivation step: negative gate bias on a p-type semiconductor creates accumulation.',
        'Derivation step: small positive gate bias creates depletion and a widening space-charge region.',
        'Derivation step: large positive gate bias creates inversion and a conducting channel at the surface.',
        'Result: the threshold voltage marks the onset of strong inversion.',
        'Interpretation: oxide charge and interface charge shift the flat-band voltage and threshold voltage in a non-ideal MOS structure.',
    ], true),

    heading('3. Introduction'),
    paragraph(
        'A field effect transistor uses an electric field to modulate charge in a semiconductor. In the MOS structure, the gate is separated from the semiconductor by an oxide, so the control variable is electrostatic rather than conductive.',
    ),
    paragraph(
        'The lecture therefore starts with the ideal MOS capacitor: no charge in the oxide, no carrier transport through the oxide, and a linear electrostatic potential across the insulating layer.',
    ),

    heading('4. Ideal MOS Capacitor'),
    paragraph(
        'In the ideal MOS capacitor the oxide contains no charge and behaves as an insulator with infinite resistivity. If the metal and semiconductor work functions are equal, the bands are flat at zero applied bias.',
    ),
    displayFormula(String.raw`\mathbf{E}_{\mathrm{ox}}=\text{constant}`),
    displayFormula(String.raw`V_{FB}=0\quad (\text{ideal, matched work functions})`),
    paragraph(
        'The key idea is that gate bias produces band bending rather than direct current through the oxide.',
    ),

    heading('5. Applied Bias Regimes'),
    paragraph(
        'For a p-type semiconductor, negative gate bias drives accumulation of holes at the interface. Small positive bias depletes the surface, and large positive bias inverts it, creating an electron-rich channel.',
    ),
    renderList([
        'Accumulation: majority carriers pile up near the surface.',
        'Depletion: mobile carriers are pushed away and fixed charge dominates.',
        'Inversion: the surface carrier type is reversed and a channel begins to form.',
    ]),
    paragraph(
        'The relevant concept is surface potential. When the gate bias changes the surface potential, the carrier density changes exponentially, so even a small bias can produce a large change in interfacial charge.',
    ),

    heading('6. Surface Potential and Depletion Width'),
    paragraph(
        'The surface potential determines the amount of band bending and therefore the depletion width. Under the depletion approximation, the width grows with surface potential and the carrier density near the interface drops.',
    ),
    displayFormula(String.raw`\phi_F=\frac{kT}{q}\ln\frac{N_A}{n_i}`),
    displayFormula(String.raw`x_d=\sqrt{\frac{2\varepsilon_s\phi_s}{qN_A}}`),
    paragraph(
        'The depletion width is a geometric response to the electrostatic potential.',
    ),

    heading('7. Threshold Voltage and Strong Inversion'),
    paragraph(
        'Threshold is reached when the surface potential reaches approximately twice the Fermi potential. Beyond that point the depletion width nearly saturates and additional gate voltage mainly increases inversion charge.',
    ),
    displayFormula(String.raw`\phi_s \approx 2\phi_F`),
    displayFormula(String.raw`V_T = V_{FB} + 2\phi_F + \frac{|Q_{d,\max}|}{C_{ox}}`),
    paragraph(
        'This is the lecture pivot: strong inversion marks the onset of a conducting channel.',
    ),

    heading('8. Non-Ideal MOS and Flat-Band Voltage'),
    paragraph(
        'Oxide charge and interface charge shift the flat-band condition away from the ideal case. The lecture therefore distinguishes ideal flat band from the practical flat-band voltage of a non-ideal MOS structure.',
    ),
    displayFormula(String.raw`V_{FB}=\Phi_{MS}-\frac{Q_{ox}}{C_{ox}}`),
    paragraph(
        'Those shifts also feed directly into the threshold voltage.',
    ),

    heading('9. Capacitance-Voltage View'),
    paragraph(
        'The C-V curve reflects the same electrostatics from a measurement perspective. As the surface moves between accumulation, depletion, and inversion, the measured capacitance changes because the depletion layer width changes.',
    ),

    heading('10. Cross Links'),
    paragraph(
        'This note connects naturally to [[Coulomb\'s Law]], [[Perfect Conductor]], and [[Faraday\'s Induction]] because the MOS capacitor is a boundary-value problem in electrostatics with screening and interface conditions.',
    ),

    heading('Source Basis'),
    paragraph(
        'Primary source: 7.1_SP_Field Effect Transistor_수정.pdf, sections on introduction, ideal MOS capacitor, applied bias, surface potential, threshold voltage, non-ideal MOS behavior, and gate-voltage characteristics.',
    ),
].join('');

const mosfetGateElectrostaticsContent = [
    heading('Field Effect Transistor - MOSFET', 1),
    paragraph('<strong>Gate voltage controls surface potential, carrier regime, and drain current.</strong>'),
    paragraph('<em>A graph-native ontology note for the semiconductor physics chapter</em>'),
    spacer(),

    heading('Abstract'),
    paragraph(
        'This note turns the MOSFET lecture into a structured ontology. The concept graph contains the reusable ideas, while the argument graph records the biasing story: gate voltage changes surface potential, surface potential changes carrier density, carrier density selects accumulation or depletion or inversion, inversion creates a channel, and the channel controls drain current.',
    ),
    paragraph(
        'The note also preserves the lecture logic that a MOSFET is a field effect transistor, not a bipolar device. The gate is the control terminal, the source and drain are the transport terminals, and the oxide isolates the gate so that electrostatics can modulate conduction without direct current injection.',
    ),

    heading('1. Concept Graph'),
    lead('Reusable concept nodes for this topic.'),
    renderList([
        'Field effect transistor',
        'MOS capacitor',
        'Flat-band condition',
        'Surface potential',
        'Accumulation',
        'Depletion',
        'Inversion layer',
        'Threshold voltage',
        'Drain current',
        'NMOS / PMOS',
        'Enhancement-mode / depletion-mode device',
        'MOSFET applications',
    ]),

    heading('2. Argument Graph'),
    lead('Directed proof-like flow of the lecture.'),
    renderList([
        'Problem: explain how a gate can control current through a semiconductor channel.',
        'Assumption: the gate is insulated by an oxide and acts through electrostatics, not through direct carrier injection.',
        'Definition: surface potential measures the band bending beneath the gate.',
        'Derivation step: gate bias shifts the surface potential and redistributes charge at the interface.',
        'Result: the semiconductor enters accumulation, depletion, or inversion.',
        'Derivation step: once inversion appears, a conducting channel links source to drain.',
        'Result: the drain current becomes a function of gate bias and drain bias.',
        'Interpretation: NMOS and PMOS differ by the majority carrier in the channel.',
        'Limitation: exact current formulas depend on device geometry and the approximations used in the lecture.',
    ], true),

    heading('3. Introduction'),
    paragraph(
        'A field effect transistor uses an electric field to modulate charge carriers in a semiconductor region. That is the central contrast with a bipolar junction transistor, where a base current controls the collector current. In the MOSFET, the gate voltage is the control variable and the current path lies between source and drain.',
    ),
    paragraph(
        'The lecture treats the device as a stack of gate, oxide, and semiconductor. The oxide isolates the gate, so the gate voltage shapes electrostatics at the interface rather than driving current directly.',
    ),

    heading('4. Gate Voltage Effect'),
    paragraph(
        'The gate-voltage discussion follows MOS capacitor theory. The flat-band condition is the reference point where the net semiconductor charge vanishes in the idealized structure. Away from flat band, the interface enters one of three regimes: accumulation, depletion, or inversion.',
    ),
    renderList([
        'Accumulation: majority carriers pile up near the surface.',
        'Depletion: mobile carriers are pushed away and fixed charge dominates.',
        'Inversion: the surface carrier type is reversed and a channel begins to form.',
    ]),
    paragraph(
        'The relevant concept is surface potential. When the gate bias changes the surface potential, the carrier density changes exponentially, so even a small bias can produce a large change in interfacial charge.',
    ),

    heading('5. Drain Voltage Effect'),
    paragraph(
        'After an inversion channel exists, the drain voltage no longer acts as a passive endpoint. It reshapes the channel potential along the source-to-drain direction, so the local channel charge is no longer uniform. The result is the familiar progression toward pinch-off and saturation.',
    ),
    paragraph(
        'This is the point where the lecture shifts from gate electrostatics to transport. Gate bias decides whether a channel exists; drain bias decides how the channel is loaded along its length.',
    ),

    heading('6. Drain Current'),
    paragraph(
        'Drain current is the main observable output of the MOSFET. In the linear region the device behaves like a gate-controlled resistor. In saturation the current is primarily governed by the gate overdrive and the charge density in the inversion channel.',
    ),
    paragraph(
        'This current-law section is the bridge from electrostatics to device operation. The argument is not only that current flows, but that current flow is controlled by the electrostatic state of the interface.',
    ),
    displayFormula(String.raw`I_D`),

    heading('7. Types of MOSFET'),
    paragraph(
        'NMOS and PMOS differ by the carrier type in the channel. Enhancement-mode devices require gate bias to create conduction, while depletion-mode devices are already biased to conduct and can be further depleted or enhanced by the gate.',
    ),
    paragraph(
        'That classification is not just a label. It is a node in the ontology because it determines which biasing regime creates the channel and how the device will appear in circuits.',
    ),

    heading('8. Applications of MOSFET'),
    paragraph(
        'The lecture closes by treating the MOSFET as a practical device for switching, amplification, and integrated circuits. The reason it matters is that a small gate control signal can regulate a much larger drain current, which makes the MOSFET the basic control element of modern electronics.',
    ),
    renderList([
        'Switching',
        'Amplification',
        'Digital logic',
        'Integrated circuits',
    ]),

    heading('9. Cross Links'),
    paragraph(
        'This note connects naturally to [[Coulomb\'s Law]], [[Perfect Conductor]], and [[Faraday\'s Induction]] because the entire device story is built from electrostatics, screening, and interface boundary conditions.',
    ),

    heading('Source Basis'),
    paragraph(
        'Primary source: 7.2_SP_Field Effect Transistor_수정.pdf, sections on introduction, gate-voltage effect, drain-voltage effect, drain current, MOSFET types, and MOSFET applications.',
    ),
].join('');

export const TOPIC_CONTENT_OVERRIDES: Record<string, string> = {
    'density-of-state': densityOfStateContent,
    'density-of-states': densityOfStateContent,
    'Density of State': densityOfStateContent,
    'Many-Body Physics': densityOfStateContent,
    'planck-quantization': planckQuantizationContent,
    'perfect-conductor': perfectConductorContent,
    'Perfect Conductor': perfectConductorContent,
    'perfect conductor': perfectConductorContent,
    'field-effect-transistor-mos-capacitor': mosCapacitorFetContent,
    'Field Effect Transistor - MOS capacitor': mosCapacitorFetContent,
    'mosfet-gate-electrostatics': mosfetGateElectrostaticsContent,
    'MOSFET Gate Electrostatics': mosfetGateElectrostaticsContent,
};
